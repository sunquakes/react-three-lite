import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { useScene } from '../context/SceneContext'
import { WaterPoolSimulation } from '../utils/WaterPoolSimulation'
import {
  WATER_POOL_OUTLINE,
  clampToWaterPool,
  isInsideWaterPool,
  sampleWaterPoolOutline
} from '../utils/WaterPoolShape'
import {
  createWaterPoolMaterials,
  createWaterPoolTileTexture
} from '../utils/WaterPoolMaterials'

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
  /** Subdivisions around the irregular pool outline. Defaults to 160. */
  segments?: number
  /** Boxes floating in the pool. Defaults to three cubes of different shapes. */
  boxes?: WaterPoolBoxConfig[]
  /** Direction from the pool towards the sun. Defaults to [0.55, 0.9, 0.35]. */
  sunDirection?: THREE.Vector3 | [number, number, number]
  /** Adds a small random ripple every so often. Defaults to true. */
  autoRipples?: boolean
  /** Enables dragging the water surface and the boxes. Defaults to true. */
  interactive?: boolean
  /** Draws the procedural sky dome behind the pool. Defaults to true. */
  sky?: boolean
}

const DEFAULT_BOXES: WaterPoolBoxConfig[] = [
  { position: [-0.42, -0.68, 0.24], size: [0.36, 0.36, 0.36], color: '#f4c95d' },
  { position: [0.38, -0.74, -0.26], size: [0.5, 0.2, 0.32], color: '#e26d5c' },
  { position: [0.08, -0.48, 0.46], size: [0.22, 0.44, 0.22], color: '#5aa9e6' }
]

const DEFAULT_SUN_DIRECTION: [number, number, number] = [0.55, 0.9, 0.35]
const POOL_FLOOR_Y = -1
const POOL_RIM_Y = 1 / 6

const getOutlineSubdivisions = (segments: number) =>
  Math.max(1, Math.round(segments / WATER_POOL_OUTLINE.length))

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
 * Water surface shaped like the irregular outline: concentric rings that scale
 * the outline towards the center, so the rim follows the basin walls exactly.
 */
const createWaterSurfaceGeometry = (segments: number) => {
  const outline = sampleWaterPoolOutline(getOutlineSubdivisions(segments))
  const angular = outline.length
  const rings = Math.max(8, Math.round(segments / 4))
  const positions: number[] = [0, 0, 0]

  for (let ring = 1; ring <= rings; ring += 1) {
    const scale = ring / rings
    outline.forEach(([x, z]) => {
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
      indices.push(inner + index, outer + index, outer + next)
      indices.push(inner + index, outer + next, inner + next)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)

  return geometry
}

/**
 * Basin with an irregular floor and the walls that rise to the rim. Everything
 * below the water line is drawn by the ray traced water shader, so only the
 * part above it is ever visible.
 */
const createBasinGeometry = (segments: number) => {
  const outline = sampleWaterPoolOutline(getOutlineSubdivisions(segments))
  const angular = outline.length
  const positions: number[] = [0, POOL_FLOOR_Y, 0]

  outline.forEach(([x, z]) => {
    positions.push(x, POOL_FLOOR_Y, z)
  })

  const indices: number[] = []
  for (let index = 0; index < angular; index += 1) {
    indices.push(0, 1 + index, 1 + ((index + 1) % angular))
  }

  const wallBottom = 1 + angular
  const wallTop = wallBottom + angular
  outline.forEach(([x, z]) => {
    positions.push(x, POOL_FLOOR_Y, z)
  })
  outline.forEach(([x, z]) => {
    positions.push(x, POOL_RIM_Y, z)
  })
  for (let index = 0; index < angular; index += 1) {
    const next = (index + 1) % angular
    indices.push(wallBottom + index, wallTop + index, wallTop + next)
    indices.push(wallBottom + index, wallTop + next, wallBottom + next)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)

  return geometry
}

/** Random point inside the outline, used for the initial and ambient ripples. */
const randomPoolPoint = (): [number, number] => {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = Math.random() * 1.8 - 0.9
    const z = Math.random() * 1.8 - 0.9
    if (isInsideWaterPool(x, z, 0.03)) {
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
  segments = 160,
  boxes = DEFAULT_BOXES,
  sunDirection = DEFAULT_SUN_DIRECTION,
  autoRipples = true,
  interactive = true,
  sky = true
}: WaterPoolProps) => {
  const sceneContext = useScene()
  const animationIdRef = useRef<number | null>(null)

  const [sunX, sunY, sunZ] = Array.isArray(sunDirection)
    ? sunDirection
    : [sunDirection.x, sunDirection.y, sunDirection.z]

  // Boxes are compared by value so an inline array does not rebuild the whole
  // scene on every parent render.
  const boxKey = JSON.stringify(boxes)
  const boxConfigs = useMemo(() => JSON.parse(boxKey) as WaterPoolBoxConfig[], [boxKey])

  useEffect(() => {
    const { renderer, scene, sceneComponents } = sceneContext
    if (!renderer || !scene || !sceneComponents?.camera) {
      return
    }

    const camera = sceneComponents.camera
    const controls = sceneComponents.controls
    const domElement = renderer.domElement

    const simulation = new WaterPoolSimulation({
      resolution,
      lightDirection: [sunX, sunY, sunZ]
    })
    for (let index = 0; index < INITIAL_DROPS; index += 1) {
      const [dropX, dropZ] = randomPoolPoint()
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

    const tileTexture = createWaterPoolTileTexture()

    const boxStates: BoxState[] = boxConfigs.map((config) => {
      const halfSize = new THREE.Vector3(...config.size).multiplyScalar(0.5)
      halfSize.set(
        THREE.MathUtils.clamp(halfSize.x, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE),
        THREE.MathUtils.clamp(halfSize.y, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE),
        THREE.MathUtils.clamp(halfSize.z, MIN_BOX_HALF_SIZE, MAX_BOX_HALF_SIZE)
      )

      const center = new THREE.Vector3(...config.position)
      const [clampedX, clampedZ] = clampToWaterPool(
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

    const lightDirectionUniform = uniform(new THREE.Vector3(sunX, sunY, sunZ).normalize())

    const materials = createWaterPoolMaterials({
      waterTexture,
      causticTexture,
      tileTexture,
      boxes: boxStates.map((state) => ({
        center: uniform(state.center),
        halfSize: uniform(state.halfSize),
        color: uniform(state.color)
      })),
      lightDirection: lightDirectionUniform
    })

    const waterGeometry = createWaterSurfaceGeometry(segments)
    const waterMesh = new THREE.Mesh(waterGeometry, materials.water)
    waterMesh.name = 'WaterPoolSurface'
    waterMesh.frustumCulled = false
    scene.add(waterMesh)

    // The basin has no top face, so the camera looks straight into the pool.
    // Its walls follow the same irregular outline as the water surface.
    const basinGeometry = createBasinGeometry(segments)
    const basinMesh = new THREE.Mesh(basinGeometry, materials.pool)
    basinMesh.name = 'WaterPoolBasin'
    scene.add(basinMesh)

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
      scene.add(mesh)
    })
    const boxMeshes = boxStates
      .map((state) => state.mesh)
      .filter((mesh): mesh is THREE.Mesh => mesh !== null)

    let skyGeometry: THREE.SphereGeometry | null = null
    let skyMesh: THREE.Mesh | null = null
    if (sky) {
      skyGeometry = new THREE.SphereGeometry(18, 32, 16)
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

    const intersectWater = (ray: THREE.Ray, target: THREE.Vector3) => {
      if (Math.abs(ray.direction.y) < 1e-6) {
        return false
      }
      const distance = -ray.origin.y / ray.direction.y
      if (distance <= 0) {
        return false
      }
      target.copy(ray.origin).addScaledVector(ray.direction, distance)

      return isInsideWaterPool(target.x, target.z)
    }

    const clampToPool = (state: BoxState) => {
      const [clampedX, clampedZ] = clampToWaterPool(
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
      const ray = getRay(event)

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
        if (!ray.intersectPlane(dragPlane, previousHit)) {
          previousHit.copy(boxHit.point)
        }
      } else if (intersectWater(ray, hitPoint)) {
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
          const [dropX, dropZ] = randomPoolPoint()
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

      scene.remove(waterMesh)
      scene.remove(basinMesh)
      boxStates.forEach((state) => {
        if (state.mesh) {
          scene.remove(state.mesh)
        }
      })
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
      tileTexture.dispose()
    }
  }, [
    sceneContext,
    resolution,
    segments,
    boxConfigs,
    sunX,
    sunY,
    sunZ,
    autoRipples,
    interactive,
    sky
  ])

  return null
}

export default WaterPool
