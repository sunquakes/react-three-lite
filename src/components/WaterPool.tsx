import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { useScene } from '../context/SceneContext'
import { WaterPoolSimulation } from '../utils/WaterPoolSimulation'
import {
  clampToWaterPool,
  createWaterPoolEdges,
  getWaterPoolBounds,
  isInsideWaterPool,
  resolveWaterPoolShape,
  sampleWaterPoolOutline,
  type WaterPoolEdge,
  type WaterPoolOutline,
  type WaterPoolShape
} from '../utils/WaterPoolShape'
import { createWaterPoolMaterials } from '../utils/WaterPoolMaterials'
import { globalParameterBus } from '../utils/ParameterBus'

export interface WaterPoolBoxConfig {
  /** Center of the box in world space. */
  position: [number, number, number]
  /** Full size of the box along each axis. */
  size: [number, number, number]
  /** CSS color of the box faces. Defaults to a neutral tone. */
  color?: string
}

export interface WaterPoolProps {
  /** Height-field cells per axis, from 8 to 512. Defaults to 128. */
  resolution?: number
  /**
   * Container outline. `'box'` is the square tub, or pass convex `[x, z]`
   * points counter-clockwise that contain the origin and stay within -1…1.
   * A `THREE.BufferGeometry` such as `ConvexGeometry` works too: its vertices
   * are projected onto the XZ plane and reduced to their convex hull.
   * Defaults to `'box'`.
   */
  shape?: WaterPoolShape
  /** Subdivisions around the container outline. Defaults to 160. */
  segments?: number
  /** Boxes floating in the pool. Defaults to three cubes of different shapes. */
  boxes?: WaterPoolBoxConfig[]
  /** Adds a small random ripple every so often. Defaults to true. */
  autoRipples?: boolean
  /** Enables dragging the water surface and the boxes. Defaults to true. */
  interactive?: boolean
  /** Draws the procedural sky dome behind the pool. Defaults to true. */
  sky?: boolean
  /** World position of the water surface centre. Defaults to [0, 0, 0]. */
  position?: THREE.Vector3 | [number, number, number]
  /** Uniform scale of the pool, its depth and the floating boxes. Defaults to 1. */
  scale?: number
}

const DEFAULT_BOXES: WaterPoolBoxConfig[] = [
  { position: [-0.42, -0.68, 0.24], size: [0.36, 0.36, 0.36], color: '#f4c95d' },
  { position: [0.38, -0.74, -0.26], size: [0.5, 0.2, 0.32], color: '#e26d5c' },
  { position: [0.08, -0.48, 0.46], size: [0.22, 0.44, 0.22], color: '#5aa9e6' }
]

const POOL_FLOOR_Y = -1

const getOutlineSubdivisions = (
  segments: number,
  outline: WaterPoolOutline
) => Math.max(1, Math.round(segments / outline.length))

const DROP_RADIUS = 0.06
const DROP_STRENGTH = 0.01
const INITIAL_DROPS = 20
const AUTO_RIPPLE_INTERVAL = 1.8
const FIXED_STEP = 1 / 60
const MAX_STEPS_PER_FRAME = 3
const DRAG_STRENGTH = 0.01
const MIN_BOX_HALF_SIZE = 0.02
const MAX_BOX_HALF_SIZE = 0.9

/**
 * Water surface shaped like the container outline: concentric rings that scale
 * the outline towards the center, so the water edge follows the outline exactly.
 */
const createWaterSurfaceGeometry = (
  segments: number,
  outline: WaterPoolOutline
) => {
  const outlinePoints = sampleWaterPoolOutline(
    outline,
    getOutlineSubdivisions(segments, outline)
  )
  const angular = outlinePoints.length
  const rings = Math.max(8, Math.round(segments / 4))
  const positions: number[] = [0, 0, 0]

  for (let ring = 1; ring <= rings; ring += 1) {
    const scale = ring / rings
    outlinePoints.forEach(([x, z]) => {
      positions.push(x * scale, 0, z * scale)
    })
  }

  const indices: number[] = []
  for (let index = 0; index < angular; index += 1) {
    indices.push(0, 1 + index, 1 + ((index + 1) % angular))
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const inner = 1 + (ring - 1) * angular
    const outer = 1 + ring * angular
    for (let index = 0; index < angular; index += 1) {
      const next = (index + 1) % angular
      // Counter-clockwise seen from above, so the surface stays front facing
      // like the flat plane it replaced. The water shader branches on
      // `frontFacing`, and a flipped winding would trace the reflection into
      // the pool instead of towards the sky.
      indices.push(inner + index, inner + next, outer + next)
      indices.push(inner + index, outer + next, outer + index)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)

  return geometry
}

/**
 * Basin floor only: the pool has no wall, so the water shader traces the basin
 * as a flat disc and rays that travel up escape to the sky.
 */
const createBasinGeometry = (
  segments: number,
  outline: WaterPoolOutline
) => {
  const outlinePoints = sampleWaterPoolOutline(
    outline,
    getOutlineSubdivisions(segments, outline)
  )
  const angular = outlinePoints.length
  const positions: number[] = [0, POOL_FLOOR_Y, 0]

  outlinePoints.forEach(([x, z]) => {
    positions.push(x, POOL_FLOOR_Y, z)
  })

  const indices: number[] = []
  for (let index = 0; index < angular; index += 1) {
    indices.push(0, 1 + index, 1 + ((index + 1) % angular))
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)

  return geometry
}

/** Random point inside the outline, used for the initial and ambient ripples. */
const randomPoolPoint = (
  outline: WaterPoolOutline,
  edges: readonly WaterPoolEdge[]
): [number, number] => {
  const { minX, maxX, minZ, maxZ } = getWaterPoolBounds(outline)
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = minX + Math.random() * (maxX - minX)
    const z = minZ + Math.random() * (maxZ - minZ)
    if (isInsideWaterPool(edges, x, z, 0.03)) {
      return [x, z]
    }
  }

  return [0, 0]
}

interface BoxState {
  center: THREE.Vector3
  previousCenter: THREE.Vector3
  halfSize: THREE.Vector3
  color: THREE.Vector3
  mesh: THREE.Mesh | null
}

/**
 * Interactive ray traced water pool, a React Three Lite port of Evan Wallace's
 * classic webgl-water demo.
 *
 * A CPU height field drives the ripples and the caustic light map, which are
 * uploaded as data textures. Water, basin and the floating boxes are shaded by
 * analytic rays in the fragment shader, so both the WebGPU and the WebGL
 * renderer show the same reflection, refraction and caustic result without
 * extra passes.
 *
 * Drag anywhere on the water to create ripples, or grab a box to push it
 * around. Orbit the camera by dragging outside the pool.
 *
 * @see https://madebyevan.com/webgl-water/
 */
const WaterPool = ({
  resolution = 128,
  shape = 'box',
  segments = 160,
  boxes = DEFAULT_BOXES,
  autoRipples = true,
  interactive = true,
  sky = true,
  position = [0, 0, 0],
  scale = 1
}: WaterPoolProps) => {
  const sceneContext = useScene()
  const animationIdRef = useRef<number | null>(null)

  const [positionX, positionY, positionZ] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z]

  // Boxes are compared by value so an inline array does not rebuild the whole
  // scene on every parent render.
  const boxKey = JSON.stringify(boxes)
  const boxConfigs = useMemo(() => JSON.parse(boxKey) as WaterPoolBoxConfig[], [boxKey])

  // Same for the shape: an inline outline array keeps a stable identity. A
  // geometry cannot round trip through JSON, so it is tracked by identity.
  const shapeGeometry = shape instanceof THREE.BufferGeometry ? shape : null
  const shapeKey = shapeGeometry ? '' : JSON.stringify(shape)
  const shapeConfig = useMemo(
    () => (shapeGeometry ? 'box' : (JSON.parse(shapeKey) as WaterPoolOutline)),
    [shapeGeometry, shapeKey]
  )
  const outline = useMemo(
    () => resolveWaterPoolShape(shapeGeometry ?? shapeConfig),
    [shapeGeometry, shapeConfig]
  )
  const edges = useMemo(() => createWaterPoolEdges(outline), [outline])

  useEffect(() => {
    const { renderer, scene, sceneComponents } = sceneContext
    if (!renderer || !scene || !sceneComponents?.camera) {
      return
    }

    const camera = sceneComponents.camera
    const controls = sceneComponents.controls
    const domElement = renderer.domElement

    // The pool is modelled in its own space: the surface centre is the origin,
    // the outline fits into -1…1 and the floor sits at y = -1. Placing it means
    // moving and scaling this group, while the shading converts every traced
    // ray back into pool space.
    const poolCenter = new THREE.Vector3(positionX, positionY, positionZ)
    const sunDirection = globalParameterBus.get('sunDirection').clone().normalize()
    const poolGroup = new THREE.Group()
    poolGroup.name = 'WaterPool'
    poolGroup.position.copy(poolCenter)
    poolGroup.scale.setScalar(scale)
    scene.add(poolGroup)

    const simulation = new WaterPoolSimulation({
      resolution,
      lightDirection: [sunDirection.x, sunDirection.y, sunDirection.z]
    })
    for (let index = 0; index < INITIAL_DROPS; index += 1) {
      const [dropX, dropZ] = randomPoolPoint(outline, edges)
      simulation.addDrop(
        dropX,
        dropZ,
        DROP_RADIUS,
        index % 2 === 0 ? DROP_STRENGTH : -DROP_STRENGTH
      )
    }
    simulation.updateNormals()
    simulation.updateCaustics()
    simulation.syncWaterTexture()

    const waterTexture = new THREE.DataTexture(
      simulation.waterTextureData,
      simulation.resolution,
      simulation.resolution,
      THREE.RGBAFormat,
      THREE.HalfFloatType
    )
    waterTexture.name = 'WaterPoolState'
    waterTexture.minFilter = THREE.LinearFilter
    waterTexture.magFilter = THREE.LinearFilter
    waterTexture.wrapS = THREE.ClampToEdgeWrapping
    waterTexture.wrapT = THREE.ClampToEdgeWrapping
    waterTexture.generateMipmaps = false
    waterTexture.needsUpdate = true

    const causticTexture = new THREE.DataTexture(
      simulation.causticTextureData,
      simulation.causticResolution,
      simulation.causticResolution,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    )
    causticTexture.name = 'WaterPoolCaustics'
    causticTexture.minFilter = THREE.LinearFilter
    causticTexture.magFilter = THREE.LinearFilter
    causticTexture.wrapS = THREE.ClampToEdgeWrapping
    causticTexture.wrapT = THREE.ClampToEdgeWrapping
    causticTexture.generateMipmaps = false
    causticTexture.needsUpdate = true

    const boxStates: BoxState[] = boxConfigs.map((config) => {
      const halfSize = new THREE.Vector3(...config.size).multiplyScalar(0.5)
      halfSize.set(
        THREE.MathUtils.clamp(halfSize.x, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE),
        THREE.MathUtils.clamp(halfSize.y, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE),
        THREE.MathUtils.clamp(halfSize.z, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE)
      )

      const center = new THREE.Vector3(...config.position)
      const [clampedX, clampedZ] = clampToWaterPool(
        edges,
        center.x,
        center.z,
        Math.max(halfSize.x, halfSize.z)
      )
      center.x = clampedX
      center.z = clampedZ
      center.y = THREE.MathUtils.clamp(center.y, POOL_FLOOR_Y + halfSize.y, 10)

      const color = new THREE.Color(config.color ?? '#d9dde3').convertSRGBToLinear()

      return {
        center,
        previousCenter: center.clone(),
        halfSize,
        color: new THREE.Vector3(color.r, color.g, color.b),
        mesh: null
      }
    })

    const lightDirectionUniform = uniform(sunDirection.clone())
    const poolCenterUniform = uniform(poolCenter)
    const poolScaleUniform = uniform(scale)

    const materials = createWaterPoolMaterials({
      waterTexture,
      causticTexture,
      boxes: boxStates.map((state) => ({
        center: uniform(state.center),
        halfSize: uniform(state.halfSize),
        color: uniform(state.color)
      })),
      lightDirection: lightDirectionUniform,
      poolCenter: poolCenterUniform,
      poolScale: poolScaleUniform
    })

    const unsubscribeSunDirection = globalParameterBus.subscribe('sunDirection', (direction) => {
      lightDirectionUniform.value.copy(direction).normalize()
      simulation.setLightDirection(lightDirectionUniform.value)
      causticTexture.needsUpdate = true
    })

    const waterGeometry = createWaterSurfaceGeometry(segments, outline)
    const waterMesh = new THREE.Mesh(waterGeometry, materials.water)
    waterMesh.name = 'WaterPoolSurface'
    waterMesh.frustumCulled = false
    poolGroup.add(waterMesh)

    // The basin is just the floor disc under the water, following the water
    // surface outline. There is no wall, so nothing of the container shows.
    const basinGeometry = createBasinGeometry(segments, outline)
    const basinMesh = new THREE.Mesh(basinGeometry, materials.pool)
    basinMesh.name = 'WaterPoolBasin'
    poolGroup.add(basinMesh)

    const boxGeometries: THREE.BoxGeometry[] = []
    boxStates.forEach((state, index) => {
      const geometry = new THREE.BoxGeometry(
        state.halfSize.x * 2,
        state.halfSize.y * 2,
        state.halfSize.z * 2
      )
      const mesh = new THREE.Mesh(geometry, materials.boxes[index])
      mesh.name = `WaterPoolBox${index}`
      mesh.position.copy(state.center)
      boxGeometries.push(geometry)
      state.mesh = mesh
      poolGroup.add(mesh)
    })
    const boxMeshes = boxStates
      .map((state) => state.mesh)
      .filter((mesh): mesh is THREE.Mesh => mesh !== null)

    let skyGeometry: THREE.SphereGeometry | null = null
    let skyMesh: THREE.Mesh | null = null
    if (sky) {
      // Keep the dome around the pool no matter how large the pool is placed.
      skyGeometry = new THREE.SphereGeometry(18 * Math.max(1, scale), 32, 16)
      skyMesh = new THREE.Mesh(skyGeometry, materials.sky)
      skyMesh.name = 'WaterPoolSky'
      skyMesh.renderOrder = -10
      skyMesh.frustumCulled = false
      skyMesh.position.copy(camera.position)
      scene.add(skyMesh)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const hitPoint = new THREE.Vector3()
    const dragPlane = new THREE.Plane()
    const previousHit = new THREE.Vector3()
    const nextHit = new THREE.Vector3()
    const moveDelta = new THREE.Vector3()

    let mode: 'none' | 'water' | 'box' = 'none'
    let draggedBox: BoxState | null = null
    let controlsDisabled = false

    const getRay = (event: PointerEvent) => {
      const rect = domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      return raycaster.ray
    }

    const poolRay = new THREE.Ray()

    /**
     * Converts a world ray into pool space. A uniform scale keeps the ray
     * direction, so only the origin has to be moved and shrunk.
     */
    const toPoolRay = (ray: THREE.Ray) => {
      poolRay.origin.copy(ray.origin).sub(poolCenter).divideScalar(scale)
      poolRay.direction.copy(ray.direction)
      return poolRay
    }

    const intersectWater = (ray: THREE.Ray, target: THREE.Vector3) => {
      if (Math.abs(ray.direction.y) < 1e-6) {
        return false
      }
      const distance = -ray.origin.y / ray.direction.y
      if (distance <= 0) {
        return false
      }
      target.copy(ray.origin).addScaledVector(ray.direction, distance)

      return isInsideWaterPool(edges, target.x, target.z)
    }

    const clampToPool = (state: BoxState) => {
      const [clampedX, clampedZ] = clampToWaterPool(
        edges,
        state.center.x,
        state.center.z,
        Math.max(state.halfSize.x, state.halfSize.z)
      )
      state.center.x = clampedX
      state.center.z = clampedZ
      state.center.y = THREE.MathUtils.clamp(
        state.center.y,
        POOL_FLOOR_Y + state.halfSize.y,
        10
      )
    }

    const handlePointerMove = (event: PointerEvent) => {
      const ray = toPoolRay(getRay(event))

      if (mode === 'water') {
        if (intersectWater(ray, hitPoint)) {
          simulation.addDrop(hitPoint.x, hitPoint.z, DROP_RADIUS, DRAG_STRENGTH)
        }
      } else if (mode === 'box' && draggedBox) {
        if (ray.intersectPlane(dragPlane, nextHit)) {
          moveDelta.subVectors(nextHit, previousHit)
          draggedBox.center.add(moveDelta)
          clampToPool(draggedBox)
          previousHit.copy(nextHit)
        }
      }

      event.preventDefault()
    }

    const handlePointerUp = () => {
      mode = 'none'
      draggedBox = null
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      if (controlsDisabled) {
        controls.enabled = true
        controlsDisabled = false
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!interactive || event.button !== 0 || mode !== 'none') {
        return
      }
      if (!domElement.contains(event.target as Node)) {
        return
      }

      const ray = getRay(event)
      const boxHit = raycaster.intersectObjects(boxMeshes, false)[0]
      const localRay = toPoolRay(ray)

      if (boxHit) {
        const state = boxStates.find((candidate) => candidate.mesh === boxHit.object)
        if (!state) {
          return
        }
        mode = 'box'
        draggedBox = state
        // Drag on a plane through the box center that faces the camera.
        dragPlane.setFromNormalAndCoplanarPoint(ray.direction.clone().negate(), state.center)
        // Start from the plane so the first move does not jump by the offset
        // between the picked surface point and the drag plane.
        if (!localRay.intersectPlane(dragPlane, previousHit)) {
          previousHit.copy(boxHit.point).sub(poolCenter).divideScalar(scale)
        }
      } else if (intersectWater(localRay, hitPoint)) {
        mode = 'water'
        simulation.addDrop(hitPoint.x, hitPoint.z, DROP_RADIUS, DRAG_STRENGTH)
      } else {
        return
      }

      controlsDisabled = true
      controls.enabled = false
      event.stopImmediatePropagation()
      event.preventDefault()

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }

    // Capture phase on the window so the drag starts before OrbitControls sees
    // the same pointer down event.
    window.addEventListener('pointerdown', handlePointerDown, true)

    let lastTimestamp = performance.now()
    let accumulator = 0
    let rippleTimer = 0

    const animate = () => {
      const now = performance.now()
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1)
      lastTimestamp = now

      if (autoRipples) {
        rippleTimer += delta
        if (rippleTimer >= AUTO_RIPPLE_INTERVAL) {
          rippleTimer = 0
          const [dropX, dropZ] = randomPoolPoint(outline, edges)
          simulation.addDrop(
            dropX,
            dropZ,
            DROP_RADIUS,
            Math.random() < 0.5 ? DROP_STRENGTH * 0.8 : -DROP_STRENGTH * 0.8
          )
        }
      }

      boxStates.forEach((state) => {
        simulation.moveBox(state.previousCenter, state.center, state.halfSize)
        state.previousCenter.copy(state.center)
        state.mesh?.position.copy(state.center)
      })

      accumulator += delta
      let steps = 0
      while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
        accumulator -= FIXED_STEP
        simulation.step(2)
        simulation.updateNormals()
        steps += 1
      }

      if (steps > 0) {
        simulation.updateCaustics()
        simulation.syncWaterTexture()
        waterTexture.needsUpdate = true
        causticTexture.needsUpdate = true
      }

      if (skyMesh) {
        skyMesh.position.copy(camera.position)
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)

    // Cleanup on unmount
    return () => {
      unsubscribeSunDirection()
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      window.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      if (controlsDisabled) {
        controls.enabled = true
      }

      scene.remove(poolGroup)
      if (skyMesh) {
        scene.remove(skyMesh)
      }

      waterGeometry.dispose()
      basinGeometry.dispose()
      boxGeometries.forEach((geometry) => geometry.dispose())
      skyGeometry?.dispose()

      materials.water.dispose()
      materials.pool.dispose()
      materials.boxes.forEach((material) => material.dispose())
      materials.sky.dispose()
      waterTexture.dispose()
      causticTexture.dispose()
    }
  }, [
    sceneContext,
    resolution,
    outline,
    edges,
    segments,
    boxConfigs,
    autoRipples,
    interactive,
    sky,
    positionX,
    positionY,
    positionZ,
    scale
  ])

  return null
}

export default WaterPool
