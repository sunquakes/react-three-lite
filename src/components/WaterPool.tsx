import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { useScene } from '../context/SceneContext'
import { WaterPoolSimulation } from '../utils/WaterPoolSimulation'
import {
  createWaterPoolEdges,
  getWaterPoolBounds,
  isInsideWaterPool,
  resolveWaterPoolShape,
  WATER_POOL_IRREGULAR_CUBE_OUTLINE,
  type WaterPoolEdge,
  type WaterPoolOutline,
  type WaterPoolShape
} from '../utils/WaterPoolShape'
import { createWaterSurfaceGeometry } from '../utils/WaterSurfaceGeometry'
import { createWaterPoolMaterials } from '../utils/WaterPoolMaterials'
import { globalParameterBus } from '../utils/ParameterBus'

export interface WaterPoolProps {
  /** Height-field cells per axis, from 8 to 512. Defaults to 128. */
  resolution?: number
  /**
   * Container outline. The default is the irregular cube outline, a skewed
   * quadrilateral. `'box'` gives the square tub, or pass convex `[x, z]` points
   * counter-clockwise that contain the origin and stay within -1…1.
   * A `THREE.BufferGeometry` such as `ConvexGeometry` works too: its vertices
   * are projected onto the XZ plane and reduced to their convex hull.
   */
  shape?: WaterPoolShape
  /** Subdivisions around the container outline. Defaults to 160. */
  segments?: number
  /** Adds a small random ripple every so often. Defaults to true. */
  autoRipples?: boolean
  /** Enables dragging the water surface. Defaults to true. */
  interactive?: boolean
  /** World position of the water surface centre. Defaults to [0, 0, 0]. */
  position?: THREE.Vector3 | [number, number, number]
  /** Uniform scale of the pool and its depth. Defaults to 1. */
  scale?: number
}

const DROP_RADIUS = 0.06
const DROP_STRENGTH = 0.01
const INITIAL_DROPS = 20
const AUTO_RIPPLE_INTERVAL = 1.8
const FIXED_STEP = 1 / 60
const MAX_STEPS_PER_FRAME = 3
const DRAG_STRENGTH = 0.01

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

/**
 * Interactive ray traced water pool, a React Three Lite port of Evan Wallace's
 * classic webgl-water demo.
 *
 * A CPU height field drives the ripples, which are uploaded as a data texture.
 * The water and the basin under it are shaded by analytic rays in the fragment
 * shader, so both the WebGPU and the WebGL renderer show the same reflection
 * and refraction result without extra passes. Only the water surface is drawn:
 * the basin is traced by the shader, so the pool has no visible bottom of its
 * own.
 *
 * Drag anywhere on the water to create ripples. Orbit the camera by dragging
 * outside the pool.
 *
 * @see https://madebyevan.com/webgl-water/
 */
const WaterPool = ({
  resolution = 128,
  shape = WATER_POOL_IRREGULAR_CUBE_OUTLINE,
  segments = 160,
  autoRipples = true,
  interactive = true,
  position = [0, 0, 0],
  scale = 1
}: WaterPoolProps) => {
  const sceneContext = useScene()
  const animationIdRef = useRef<number | null>(null)

  const [positionX, positionY, positionZ] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z]

  // The shape is compared by value so an inline outline array keeps a stable
  // identity. A geometry cannot round trip through JSON, so it is tracked by
  // identity.
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

    const simulation = new WaterPoolSimulation({ resolution })
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

    const lightDirectionUniform = uniform(sunDirection.clone())
    const poolCenterUniform = uniform(poolCenter)
    const poolScaleUniform = uniform(scale)

    const materials = createWaterPoolMaterials({
      waterTexture,
      lightDirection: lightDirectionUniform,
      poolCenter: poolCenterUniform,
      poolScale: poolScaleUniform
    })

    const unsubscribeSunDirection = globalParameterBus.subscribe('sunDirection', (direction) => {
      lightDirectionUniform.value.copy(direction).normalize()
    })

    const waterGeometry = createWaterSurfaceGeometry(segments, outline)
    const waterMesh = new THREE.Mesh(waterGeometry, materials.water)
    waterMesh.name = 'WaterPoolSurface'
    waterMesh.frustumCulled = false
    poolGroup.add(waterMesh)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const hitPoint = new THREE.Vector3()

    let dragging = false
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

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) {
        return
      }

      const ray = toPoolRay(getRay(event))
      if (intersectWater(ray, hitPoint)) {
        simulation.addDrop(hitPoint.x, hitPoint.z, DROP_RADIUS, DRAG_STRENGTH)
      }

      event.preventDefault()
    }

    const handlePointerUp = () => {
      dragging = false
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      if (controlsDisabled) {
        controls.enabled = true
        controlsDisabled = false
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!interactive || event.button !== 0 || dragging) {
        return
      }
      if (!domElement.contains(event.target as Node)) {
        return
      }

      const localRay = toPoolRay(getRay(event))
      if (!intersectWater(localRay, hitPoint)) {
        return
      }
      dragging = true
      simulation.addDrop(hitPoint.x, hitPoint.z, DROP_RADIUS, DRAG_STRENGTH)

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

      accumulator += delta
      let steps = 0
      while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
        accumulator -= FIXED_STEP
        simulation.step(2)
        simulation.updateNormals()
        steps += 1
      }

      if (steps > 0) {
        simulation.syncWaterTexture()
        waterTexture.needsUpdate = true
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

      waterGeometry.dispose()

      materials.water.dispose()
      waterTexture.dispose()
    }
  }, [
    sceneContext,
    resolution,
    outline,
    edges,
    segments,
    autoRipples,
    interactive,
    positionX,
    positionY,
    positionZ,
    scale
  ])

  return null
}

export default WaterPool
