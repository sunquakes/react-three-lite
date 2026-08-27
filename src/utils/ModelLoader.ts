import * as THREE from 'three'
import { GLTFLoader as THREEGLTFLoader, FBXLoader as THREEFBXLoader, OBJLoader as THREEOBJLoader, MTLLoader as THREEMTLLoader, DRACOLoader, mergeVertices } from 'three-stdlib'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

const OBJECT_STORE = 'THREE_VUE_OBJECT_STORE'
const DB_NAME = 'THREE_VUE_OBJECT_DB'

const TEXTURE_PROPERTIES = [
  'map',
  'emissiveMap',
  'normalMap',
  'bumpMap',
  'alphaMap',
  'aoMap',
  'roughnessMap',
  'metalnessMap'
] as const

/**
 * Create a LoadingManager plus a promise that settles once every request it
 * tracks has finished.
 *
 * Texture loading inside MTLLoader/FBXLoader is fire-and-forget:
 * `TextureLoader.load()` returns a Texture whose `image` is still `null` and
 * fills it in later from an ImageLoader callback. Inspecting the textures right
 * after the model has been parsed therefore tells us nothing about their state.
 * Routing all requests through our own manager gives us a reliable hook: its
 * `onLoad` fires when the last image has either loaded or failed.
 */
function createTextureManager(): { manager: THREE.LoadingManager; waitAll: () => Promise<void> } {
  let settle: (() => void) | null = null
  let started = false
  const done = new Promise<void>((resolve) => {
    settle = resolve
  })
  const manager = new THREE.LoadingManager()
  manager.onStart = () => {
    started = true
  }
  manager.onLoad = () => {
    settle?.()
  }

  return {
    manager,
    // `onLoad` never fires when nothing was requested, so resolve immediately
    // for models without textures.
    waitAll: () => (started ? done : Promise.resolve())
  }
}

/**
 * Flag every usable texture of the model with `needsUpdate = true` to bump its
 * version.
 *
 * The WebGPU backend binds a placeholder texture the first time it sees a
 * texture whose image is not decoded yet, records the version it uploaded and
 * then skips any further upload while that version stays the same, which
 * leaves the model permanently untextured. Bumping the version forces the real
 * image to be uploaded. The classic WebGL backend re-checks `image.complete`
 * every frame and is therefore unaffected.
 *
 * Textures whose image never arrived (e.g. a 404 in the MTL file) are skipped:
 * their version must stay at 0 so the backend keeps using its default texture
 * instead of dereferencing a null image.
 */
function refreshTextures(model: THREE.Group): void {
  const textures = new Set<THREE.Texture>()
  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      const anyMat = mat as unknown as Record<string, unknown>
      for (const key of TEXTURE_PROPERTIES) {
        const tex = anyMat[key]
        if (tex && (tex as THREE.Texture).isTexture) {
          textures.add(tex as THREE.Texture)
        }
      }
    }
  })

  textures.forEach((tex) => {
    const img = tex.image as HTMLImageElement | null | undefined
    if (!img) return
    if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
      if (!img.complete || img.naturalWidth === 0) return
    }
    tex.needsUpdate = true
  })
}

// Helper function to validate if ArrayBuffer contains valid model data (not HTML)
function isValidModelData(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false
  
  const view = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 100))
  const text = new TextDecoder('utf-8').decode(view.slice(0, Math.min(view.length, 50)))
  
  // Check if it starts with HTML tags
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return false
  }
  
  return true
}

/**
 * Walk a loaded model and normalize common PBR issues that otherwise lead to
 * models rendering "black" on fresh scenes:
 *   1. Mark base color / emission textures as SRGB so they decode correctly
 *      under ACESFilmic tone mapping.
 *   2. Prevent MeshStandard/Physical from reaching metalness = 1.0 combined
 *      with roughness = 0.0: that surface would be 100% reflective mirror
 *      and resolve to pure black without a high-quality HDRI environment.
 *   3. Upgrade legacy MeshLambert/Phong to MeshStandard so they receive
 *      lighting from the default envMap (Lambert/Phong ignore envMap).
 */
function normalizeMaterials(model: THREE.Group): void {
  model.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.material) return

    const mats: THREE.Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    let needsSmoothNormals = false

    for (let i = 0; i < mats.length; i++) {
      const src = mats[i]

      // --- Color-space tagging ----------------------------------------------
      const tagSRGB = (tex: THREE.Texture | null | undefined) => {
        if (tex) tex.colorSpace = THREE.SRGBColorSpace
      }
      const asPBR = src as unknown as {
        map?: THREE.Texture | null
        emissiveMap?: THREE.Texture | null
        metalness?: number
        roughness?: number
        color?: THREE.Color
        emissive?: THREE.Color
      }
      tagSRGB(asPBR.map ?? null)
      tagSRGB(asPBR.emissiveMap ?? null)

      // --- Lambert/Phong -> Standard ---------------------------------------
      // MeshLambertMaterial / MeshPhongMaterial don't sample scene.environment
      // and therefore appear flat / overly dark compared to PBR siblings.
      if (
        (src as THREE.MeshLambertMaterial).isMeshLambertMaterial ||
        (src as THREE.MeshPhongMaterial).isMeshPhongMaterial
      ) {
        const legacy = src as THREE.MeshPhongMaterial
        // FBX exports often set DiffuseColor to (0.8, 0.8, 0.8) as a default
        // multiplier. When a diffuse map is present the texture already carries
        // full color information, so using the 0.8 multiplier darkens the result.
        // Use white instead to display the texture at its intended brightness.
        const color = legacy.map
          ? new THREE.Color(0xffffff)
          : legacy.color?.clone() ?? new THREE.Color(0xffffff)
        mats[i] = new THREE.MeshStandardMaterial({
          color,
          map: legacy.map ?? null,
          bumpMap: legacy.bumpMap ?? null,
          bumpScale: legacy.bumpScale,
          normalMap: legacy.normalMap ?? null,
          normalScale: legacy.normalScale,
          emissive: legacy.emissive?.clone() ?? new THREE.Color(0x000000),
          emissiveMap: legacy.emissiveMap ?? null,
          emissiveIntensity: legacy.emissiveIntensity,
          alphaMap: legacy.alphaMap ?? null,
          transparent: legacy.transparent,
          opacity: legacy.opacity,
          // OBJ/MTL models from DCC tools often have inconsistent winding, so
          // force double-sided to avoid back-face culling holes.
          side: THREE.DoubleSide,
          // We recompute smooth normals below, so force smooth interpolation.
          flatShading: false,
          roughness: 0.85,
          metalness: 0.05
        })
        // Dispose the original only after we've read every field we need.
        src.dispose()
        needsSmoothNormals = true
        continue
      }

      // --- Clamp extreme PBR parameters ------------------------------------
      if (
        (src as THREE.MeshStandardMaterial).isMeshStandardMaterial ||
        (src as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial
      ) {
        if (typeof asPBR.roughness === 'number' && asPBR.roughness < 0.08) {
          asPBR.roughness = 0.08
        }
        if (
          typeof asPBR.metalness === 'number' &&
          typeof asPBR.roughness === 'number' &&
          asPBR.metalness > 0.95 &&
          asPBR.roughness < 0.25
        ) {
          // Mirror-like surface without proper HDRI = pure black. Nudge it
          // towards "brushed metal" so the default PMREM env is visible.
          asPBR.roughness = Math.max(asPBR.roughness, 0.25)
        }
      }
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mats as THREE.Material[]
    } else {
      mesh.material = mats[0]
    }

    // OBJ/MTL exports often carry per-face (split) normals that make curved
    // surfaces look faceted/lined. Re-weld shared vertices and recompute smooth
    // normals so cylinders and other curved parts render smoothly.
    //
    // Note: mergeVertices() hashes EVERY attribute (position + normal + uv),
    // so vertices that share a position but carry different split normals are
    // never welded, leaving the geometry effectively non-indexed. In that case
    // computeVertexNormals() assigns each vertex the normal of its single
    // triangle, which turns curved surfaces into flat-shaded facets with
    // visible "lines". Normals are recomputed below anyway, so drop the normal
    // attribute before welding to merge shared positions (UV is kept, so
    // texture seams stay intact).
    if (needsSmoothNormals && mesh.geometry) {
      const geometry = mesh.geometry
      const clean = geometry.clone()
      clean.deleteAttribute('normal')
      const welded = mergeVertices(clean)
      welded.computeVertexNormals()
      mesh.geometry = welded
      geometry.dispose()
    }
  })
}

export default function fileLoader(
  url: string,
  cache: boolean = true,
  onProgress?: (event: LoadEvent) => void
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    if (!cache) {
      fetchWithProgress(url, onProgress).then((data) => {
        resolve(data)
      })
      return
    }
    const key = btoa(url)
    const checkCacheAndLoadModel = () => {
      onProgress?.({ type: 'cache', progress: 0 })
      const request = indexedDB.open(DB_NAME, 2)
      request.onerror = () => {
        fetchWithProgress(url, onProgress).then((data) => {
          resolve(data)
        })
      }
      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction([OBJECT_STORE], 'readonly')
        const objectStore = transaction.objectStore(OBJECT_STORE)
        const getRequest = objectStore.get(key)
        getRequest.onsuccess = () => {
          if (getRequest.result) {
            // Validate cached data to ensure it's not corrupted HTML
            if (!isValidModelData(getRequest.result)) {
              console.warn(`Cached data for ${url} is invalid (possibly HTML). Refetching...`)
              // Delete invalid cache entry
              const deleteTransaction = db.transaction([OBJECT_STORE], 'readwrite')
              const deleteObjectStore = deleteTransaction.objectStore(OBJECT_STORE)
              deleteObjectStore.delete(key)
              // Fetch fresh data
              fetchWithProgress(url, onProgress).then((data) => {
                const writeTransaction = db.transaction([OBJECT_STORE], 'readwrite')
                const writeObjectStore = writeTransaction.objectStore(OBJECT_STORE)
                writeObjectStore.put(data, key)
                resolve(data)
              }).catch(reject)
              return
            }
            onProgress?.({ type: 'cache', progress: 100 })
            resolve(getRequest.result)
          } else {
            fetchWithProgress(url, onProgress).then((data) => {
              const writeTransaction = db.transaction([OBJECT_STORE], 'readwrite')
              const writeObjectStore = writeTransaction.objectStore(OBJECT_STORE)
              writeObjectStore.put(data, key)
              resolve(data)
            })
          }
        }
        getRequest.onerror = () => {
          fetchWithProgress(url, onProgress).then((data) => {
            resolve(data)
          })
        }
      }
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(OBJECT_STORE)) {
          db.createObjectStore(OBJECT_STORE)
        }
      }
    }
    checkCacheAndLoadModel()
  })
}

async function fetchWithProgress(url: string, onProgress?: (event: LoadEvent) => void): Promise<ArrayBuffer> {
  const response = await fetch(url)
  
  // Validate response content type to prevent HTML error pages from being treated as model data
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('text/html')) {
    throw new Error(`Failed to load model from ${url}: Server returned HTML instead of model data. Check if the file exists and the URL is correct.`)
  }
  
  if (!response.ok) {
    throw new Error(`Failed to load model from ${url}: HTTP ${response.status} ${response.statusText}`)
  }
  
  const contentLength = response.headers.get('content-length')
  const total = contentLength ? parseInt(contentLength, 10) : 0
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Failed to get reader')
  }
  const chunks: Uint8Array[] = []
  let loaded = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    onProgress?.({ type: 'fetch', progress: total ? Math.round((loaded / total) * 100) : 0 })
  }
  const combined = new Uint8Array(loaded)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(chunk, offset)
    offset += chunk.length
  }
  return combined.buffer
}

function getDefaultDecoderPath(): string {
  return 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
}

let dracoLoader: DRACOLoader | null = null

function getDRACOLoader(decoderPath?: string): DRACOLoader {
  const path = decoderPath || getDefaultDecoderPath()
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(path)
    dracoLoader.preload()
  }
  return dracoLoader
}

export async function GLTFLoader(
  url: string,
  useDraco?: boolean,
  dracoDecoderPath?: string,
  cache?: boolean,
  onProgress?: (event: LoadEvent) => void
): Promise<THREE.Group> {
  const data = await fileLoader(url, cache, onProgress)
  const loader = new THREEGLTFLoader()
  if (useDraco) {
    loader.setDRACOLoader(getDRACOLoader(dracoDecoderPath))
  }
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    loader.parse(data, '', (gltf) => {
      const model = gltf.scene as THREE.Group
      model.animations = gltf.animations as THREE.AnimationClip[]
      normalizeMaterials(model)
      onProgress?.({ type: 'parse', progress: 100 })
      resolve(model)
    })
  })
}

export async function FBXLoader(
  url: string,
  cache?: boolean,
  onProgress?: (event: LoadEvent) => void
): Promise<THREE.Group> {
  const data = await fileLoader(url, cache)
  const { manager, waitAll } = createTextureManager()
  const loader = new THREEFBXLoader(manager)
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    const model = loader.parse(data, '') as THREE.Group
    normalizeMaterials(model)
    // FBX textures (data/blob URLs) are loaded the same asynchronous way as
    // OBJ/MTL ones, so wait for the manager before releasing the model.
    void waitAll().then(() => {
      refreshTextures(model)
      onProgress?.({ type: 'parse', progress: 100 })
      resolve(model)
    })
  })
}

/**
 * three-stdlib's OBJLoader marks an entire `o`/`g` object as line geometry the
 * moment it contains a single `l`/`p` element, so every face of that object is
 * then rendered as white LineSegments pairs (the "missing surfaces / white
 * wireframe" artifact). Some DCC exports mix `f` and `l` inside one object.
 * Split such mixed objects: line/point elements are moved into synthetic
 * objects so faces stay faces and lines stay lines.
 */
function splitMixedLineObjects(text: string): string {
  const lines = text.split(/\r?\n/)
  let currentObjectHasFaces = false
  let currentObjectHasLines = false
  const out: string[] = []
  for (const line of lines) {
    if (/^[og](\s|$)/.test(line)) {
      currentObjectHasFaces = false
      currentObjectHasLines = false
      out.push(line)
    } else if (/^f\s/.test(line)) {
      if (currentObjectHasLines) {
        // Faces after lines: move them into a synthetic face object.
        out.push('o __r3l_face_split')
        currentObjectHasLines = false
      }
      currentObjectHasFaces = true
      out.push(line)
    } else if (/^[lp]\s/.test(line)) {
      if (currentObjectHasFaces) {
        // Detach line/point elements so the faces keep rendering as mesh.
        out.push('o __r3l_line_split')
        currentObjectHasFaces = false
      }
      currentObjectHasLines = true
      out.push(line)
    } else {
      out.push(line)
    }
  }
  return out.join('\n')
}

export async function OBJLoader(
  url: string,
  mtlUrl: string,
  cache?: boolean,
  onProgress?: (event: LoadEvent) => void
): Promise<THREE.Group> {
  const data = await fileLoader(url, cache, onProgress)
  const mtlData = await fileLoader(mtlUrl, cache)
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(data)
  const mtlText = decoder.decode(mtlData)
  const loader = new THREEOBJLoader()
  const { manager, waitAll } = createTextureManager()
  const mtlLoader = new THREEMTLLoader(manager)
  const mtl = mtlLoader.parse(mtlText, '')
  loader.setMaterials(mtl)
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    const model = loader.parse(splitMixedLineObjects(text)) as THREE.Group
    normalizeMaterials(model)
    // OBJ/MTL textures are requested while the materials are created, but the
    // Texture objects are handed back with an empty image and filled in later.
    // Wait for the shared LoadingManager to report that every image request has
    // settled, then bump the texture versions and release the model, so it is
    // never added to the scene while its textures are still placeholders.
    void waitAll().then(() => {
      refreshTextures(model)
      onProgress?.({ type: 'parse', progress: 100 })
      resolve(model)
    })
  })
}

/**
 * Recursively dispose every GPU resource owned by a loaded model:
 * geometries, materials and — most importantly — the textures referenced by
 * those materials. Textures are usually the dominant VRAM cost of a model,
 * so disposing only geometry and material still leaks them.
 *
 * Also detaches the model from its parent so the disposed subtree stops taking
 * part in scene traversal.
 */
export function disposeModel(model: THREE.Object3D): void {
  const disposeMaterial = (material: THREE.Material): void => {
    // Any material property holding a Texture is a potential leak, so walk the
    // whole material instead of hardcoding a map/normalMap/... allowlist.
    for (const value of Object.values(material as unknown as Record<string, unknown>)) {
      if (value && (value as THREE.Texture).isTexture === true) {
        ;(value as THREE.Texture).dispose()
      }
    }
    material.dispose()
  }

  model.traverse((child) => {
    const obj = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    obj.geometry?.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(disposeMaterial)
      } else {
        disposeMaterial(obj.material)
      }
    }
  })

  model.parent?.remove(model)
}

/**
 * Dispose the shared DRACOLoader and terminate its worker pool.
 * The loader is a module level singleton created on first use, so without this
 * its workers stay alive for the whole page lifetime.
 */
export function disposeDRACOLoader(): void {
  if (dracoLoader) {
    dracoLoader.dispose()
    dracoLoader = null
  }
}
