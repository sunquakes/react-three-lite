import { Group, AnimationClip, Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { GLTFLoader as THREEGLTFLoader, FBXLoader as THREEFBXLoader, OBJLoader as THREEOBJLoader, MTLLoader as THREEMTLLoader, DRACOLoader } from 'three-stdlib'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

const OBJECT_STORE = 'THREE_VUE_OBJECT_STORE'
const DB_NAME = 'THREE_VUE_OBJECT_DB'

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
): Promise<Group> {
  const data = await fileLoader(url, cache, onProgress)
  const loader = new THREEGLTFLoader()
  if (useDraco) {
    loader.setDRACOLoader(getDRACOLoader(dracoDecoderPath))
  }
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    loader.parse(data, '', (gltf) => {
      const model = gltf.scene as Group
      model.animations = gltf.animations as AnimationClip[]
      onProgress?.({ type: 'parse', progress: 100 })
      resolve(model)
    })
  })
}

export async function FBXLoader(
  url: string,
  cache?: boolean,
  onProgress?: (event: LoadEvent) => void
): Promise<Group> {
  const data = await fileLoader(url, cache)
  const loader = new THREEFBXLoader()
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    const model = loader.parse(data, '') as Group
    onProgress?.({ type: 'parse', progress: 100 })
    resolve(model)
  })
}

function fixOBJMaterials(model: Group): void {
  model.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.material instanceof MeshBasicMaterial) {
        child.material = new MeshStandardMaterial({
          color: child.material.color,
          roughness: 0.8,
          metalness: 0.2
        })
      }
    }
  })
}

export async function OBJLoader(
  url: string,
  mtlUrl: string,
  cache?: boolean,
  onProgress?: (event: LoadEvent) => void
): Promise<Group> {
  const data = await fileLoader(url, cache, onProgress)
  const mtlData = await fileLoader(mtlUrl, cache)
  const decoder = new TextDecoder('utf-8')
  const text = decoder.decode(data)
  const mtlText = decoder.decode(mtlData)
  const loader = new THREEOBJLoader()
  const mtlLoader = new THREEMTLLoader()
  const mtl = mtlLoader.parse(mtlText, '')
  loader.setMaterials(mtl)
  return new Promise((resolve) => {
    onProgress?.({ type: 'parse', progress: 0 })
    const model = loader.parse(text) as Group
    fixOBJMaterials(model)
    onProgress?.({ type: 'parse', progress: 100 })
    resolve(model)
  })
}
