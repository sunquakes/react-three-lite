import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  cameraProjectionMatrix,
  float,
  length,
  modelViewMatrix,
  mx_noise_float,
  positionLocal,
  smoothstep,
  varying,
  vec2,
  vec3,
  vec4
} from 'three/tsl'
import {
  Scene,
  GLTFLoaderAsync,
  GlowSprite,
  HeightFog,
  Movable,
  Popup,
  RadarSweep,
  SignalWave,
  SkyDome,
  Snow,
  SweepLight,
  disposeModel
} from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

// Cinematic captions for each beat of the mission, one line per locale. The
// page passes translated strings in; these English defaults keep the scene
// readable when it is rendered without any i18n wiring.
export interface SceneCaptions {
  intro: string
  survey: string
  driving: string
  parked: string
  acquiring: string
  finding: string
  downlink: string
}

const DEFAULT_CAPTIONS: SceneCaptions = {
  intro: 'Qiusuo · Mars Dream',
  survey: 'Survey stop · Sampling the regolith',
  driving: 'SOL 118 · Searching the dune plain',
  parked: 'Parked at the crater rim',
  acquiring: 'Acquiring the Deep Space Network downlink',
  finding: 'Something green in the regolith',
  downlink: "Downlink locked · streaming Qiusuo's data to Earth"
}

interface ComplexSceneDemoProps {
  rendererType?: 'webgpu' | 'webgl'
  captions?: SceneCaptions
}

// Scene layout, all derived from the story: Qiusuo the rover crosses the dune
// plain toward the rim of an impact crater, parks at the relay station and
// streams its data to the pale blue Earth in the black sky, and finishes on
// the green fern patch that has taken root in the regolith.
const CRATER = { x: -1.5, z: -23, radius: 10.5, depth: 3, rim: 1 }
// The rover's parking spot at the crater rim, facing the relay station.
const ROVER = { x: 1.8, z: -10.4 }
// The downlink beacon on the flat plain just outside the rim: far enough not
// to sit in the crater, close enough to stay in frame next to the rover.
const STATION = { x: -7.6, z: -11.2 }
// The transport that set Qiusuo down: the cargo lander that carried the rover
// to Mars and can lift it back off, standing on the far plain well away from
// the station and the crater the rover surveys.
const LANDER = { x: -76, z: -52 }
// NASA's Viking lander model is authored nine units tall over a sixteen-unit
// leg span; scaling it by height keeps the whole ship in proportion and makes
// it dwarf the 2.8-unit rover on the plain.
const LANDER_HEIGHT = 9
// NASA's catalogue ships no biological models, so the living specimen is a
// CC0 fern patch from Poly Haven (https://polyhaven.com/a/fern_02); it sprouts
// on the near rim crest, in view of the parked rover.
const PLANT = { x: -3.3, z: -12.6 }
const PLANT_WIDTH = 2.2
const SUN_DIRECTION = new THREE.Vector3(-0.78, 0.2, -0.6).normalize()
const EARTH_DIRECTION = new THREE.Vector3(-0.442, 0.241, -0.864).normalize()
const EARTH_DISTANCE = 150

// Signal downlink: pulsed arcs leave the station one after another, expanding
// as they climb toward Earth the way a broadcast signal spreads and dies out.
const SIGNAL_RING_COUNT = 7
const SIGNAL_PULSE_START = 0.55
const SIGNAL_PULSE_END = 4.6
const SIGNAL_TRAVEL = 30
const SIGNAL_SPEED = 9

// The mast camera opens up before the downlink: once Qiusuo is parked its head
// swings out of the stowed heading in one wide pass across the rim and gathers
// back onto the relay station, so the vehicle's own camera is working the scene
// while the signal starts climbing toward Earth.
const MAST_SPREAD_DELAY = 400
const MAST_SPREAD_DURATION = 2200
const MAST_SPREAD_ANGLE = 1.15

// The six drive wheels of NASA's Perseverance, given in the model's local
// space before the whole model is scaled. +X is the wheel axle; rolling
// forward (moving toward +Z) is a positive rotation around that axle.
const WHEEL_CENTERS = [
  new THREE.Vector3(-1.144, -0.0003, -1.13), // rear-left
  new THREE.Vector3(-1.266, 0.0001, -0.055), // mid-left
  new THREE.Vector3(-1.144, -0.0003, 1.13), // front-left
  new THREE.Vector3(1.144, 0.0005, -1.13), // rear-right
  new THREE.Vector3(1.266, 0.0001, -0.055), // mid-right
  new THREE.Vector3(1.144, -0.0003, 1.13) // front-right
]
const WHEEL_RADIUS = 0.231

// The search: Qiusuo never makes straight for the rim. It sweeps the dune
// plain on a serpentine survey - out across the open sand, back along the
// crater side, then a last pass that finally closes on the parking spot.
const DRIVE_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(12.5, 0, -4.4),
  new THREE.Vector3(9.8, 0, -1.9),
  new THREE.Vector3(6.2, 0, 0.1),
  new THREE.Vector3(2.0, 0, 0.5),
  new THREE.Vector3(-2.2, 0, -0.2),
  new THREE.Vector3(-5.8, 0, -1.9),
  new THREE.Vector3(-7.4, 0, -4.6),
  new THREE.Vector3(-7.2, 0, -7.2),
  new THREE.Vector3(-4.4, 0, -8.5),
  new THREE.Vector3(-0.9, 0, -7.8),
  new THREE.Vector3(2.8, 0, -6.5),
  new THREE.Vector3(5.2, 0, -8.5),
  new THREE.Vector3(3.1, 0, -10.2),
  new THREE.Vector3(1.8, 0, -10.4)
])
const DRIVE_START = DRIVE_CURVE.points[0]
const DRIVE_SPEED = 1.1 // world units per second
const DRIVE_WAYPOINTS = 60
// Survey stations along the route, given as fractions of the path length: the
// rover halts there, sweeps the ground with its mast, then drives on.
const DRIVE_STOPS = [
  { t: 0.31, dwell: 2400 },
  { t: 0.6, dwell: 2400 }
]
// Heading the rover pivots to after parking, facing the relay station.
const SURVEY_HEADING = -1.62
// Ground radar: while the rover halts at a survey station a ring pulse rolls
// out from under it over the sand, one full sweep every few seconds.
const SCAN_RADIUS = 7
const SCAN_PERIOD = 2.6

// Past the playable plain the ground sags away like the surface of a very large
// sphere. The curve drops the far edge of the terrain below the horizon, so the
// boundary of the mesh can never be seen from inside the scene.
function terrainCurvature(x: number, z: number): number {
  const beyond = Math.max(0, Math.hypot(x, z) - 150)
  return -(beyond * beyond) / 2000
}

// The dune field's crest line, shared by the height field and the ground
// shading. A long transverse swell runs downwind (roughly toward +Z), its
// crests are sharpened against broad troughs, and a shorter crossing train
// breaks each ridge into separate dunes.
function duneCrest(x: number, z: number): number {
  const phase = Math.sin(x * 0.075 - z * 0.04 + Math.sin(z * 0.03) * 1.6)
  return Math.sign(phase) * Math.pow(Math.abs(phase), 1.5)
}

// Shared height field so terrain, rocks, rover and the station all agree on
// where the ground is. The plain around the parking spot is flattened, the
// crater is carved out of it and lifted into a rim.
function terrainHeight(x: number, z: number): number {
  const duneNoise =
    duneCrest(x, z) * 1.05 +
    Math.sin((x + z) * 0.115 + 0.6) * 0.3 +
    Math.sin(x * 0.19 - z * 0.13 + 2.1) * 0.12
  const flattenNearRover = THREE.MathUtils.smoothstep(Math.hypot(x - ROVER.x, z - ROVER.z), 3.2, 12)
  // The lander's leg span is far wider than the rover, so the dunes are levelled
  // into a landing pad beneath it; every foot then rests on the same ground.
  const flattenNearLander = THREE.MathUtils.smoothstep(Math.hypot(x - LANDER.x, z - LANDER.z), 6, 22)
  const dunes = duneNoise * flattenNearRover * flattenNearLander

  const distance = Math.hypot(x - CRATER.x, z - CRATER.z)
  const t = distance / CRATER.radius
  const bowl = t < 1 ? -CRATER.depth * Math.pow(1 - t * t, 1.35) : 0
  const rim = CRATER.rim * Math.exp(-Math.pow((t - 1) / 0.2, 2))

  return dunes + bowl + rim + terrainCurvature(x, z)
}

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

// Ground detail map: sand grain, wind streaks and embedded grit tiled over the
// plain. The vertex colours still carry the large-scale regolith tones; this
// canvas adds the fine surface the terrain mesh is far too coarse to resolve.
function createRegolithTexture(): THREE.CanvasTexture | null {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return null

  const random = createRandom(48271)

  const grain = context.createImageData(size, size)
  for (let i = 0; i < grain.data.length; i += 4) {
    const value = 210 + random() * 45
    grain.data[i] = value
    grain.data[i + 1] = value * 0.95
    grain.data[i + 2] = value * 0.89
    grain.data[i + 3] = 255
  }
  context.putImageData(grain, 0, 0)

  // Wind streaks: shallow bands of lighter and darker sand, drawn once per
  // wrapped corner so the pattern stays seamless when the tile repeats.
  for (let i = 0; i < 220; i += 1) {
    const light = random() > 0.45
    const x = random() * size
    const y = random() * size
    const length = 40 + random() * 220
    const alpha = (0.03 + random() * 0.05).toFixed(3)
    context.strokeStyle = light ? `rgba(255, 240, 218, ${alpha})` : `rgba(94, 50, 32, ${alpha})`
    context.lineWidth = 0.6 + random() * 2.2
    for (const offsetX of [0, -size]) {
      for (const offsetY of [0, -size]) {
        context.beginPath()
        context.moveTo(x + offsetX, y + offsetY)
        context.lineTo(x + offsetX + length, y + offsetY + length * 0.35)
        context.stroke()
      }
    }
  }

  // Wind ripples: short trains of shallow crest-and-trough arcs. At the tiling
  // used by the terrain they read as blown sand ripples underfoot, the detail
  // the 512-segment mesh is far too coarse to model.
  for (let i = 0; i < 30; i += 1) {
    const originX = random() * size
    const originY = random() * size
    const gap = 5 + random() * 7
    const bend = 1.2 + random() * 2.6
    const length = 60 + random() * 140
    const phase = random() * Math.PI * 2
    const lines = 3 + Math.floor(random() * 4)
    for (let k = 0; k < lines; k += 1) {
      context.strokeStyle =
        k % 2 === 0 ? 'rgba(255, 240, 218, 0.22)' : 'rgba(84, 44, 26, 0.22)'
      context.lineWidth = 1 + random() * 0.8
      for (const offsetX of [0, -size]) {
        for (const offsetY of [0, -size]) {
          context.beginPath()
          for (let step = 0; step <= 10; step += 1) {
            const progress = step / 10
            const px = originX + offsetX + progress * length
            const py = originY + offsetY + k * gap + Math.sin(progress * Math.PI * 2 + phase) * bend
            if (step === 0) context.moveTo(px, py)
            else context.lineTo(px, py)
          }
          context.stroke()
        }
      }
    }
  }

  // Grit and small pebbles bedded in the sand.
  for (let i = 0; i < 900; i += 1) {
    const radius = 0.4 + random() * 1.3
    context.fillStyle = random() > 0.5 ? 'rgba(255, 236, 208, 0.2)' : 'rgba(84, 42, 26, 0.28)'
    context.beginPath()
    context.arc(random() * size, random() * size, radius, 0, Math.PI * 2)
    context.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((child) => {
    const node = child as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    if ((node as THREE.InstancedMesh).isInstancedMesh) {
      ;(node as THREE.InstancedMesh).dispose()
    }
    if (node.geometry) node.geometry.dispose()
    const material = node.material
    if (Array.isArray(material)) {
      material.forEach((item) => {
        const map = (item as THREE.Material & { map?: THREE.Texture }).map
        if (map) map.dispose()
        item.dispose()
      })
    } else if (material) {
      const map = (material as THREE.Material & { map?: THREE.Texture }).map
      if (map) map.dispose()
      material.dispose()
    }
  })
}

// Eroded mesa. A lathe spins an erosion profile (talus skirt, sheer cliff,
// benches, broken cap) while multi-frequency gullies push the wall in and out
// around the circumference and horizontal strata are baked into vertex
// colours, so the distant skyline reads as weathered rock rather than a prism.
function createMassif(height: number, radius: number, seed: number, material: THREE.Material) {
  // Radius (fraction of `radius`) against height (fraction of `height`).
  const control: Array<[number, number]> = [
    [1.3, 0],
    [1.04, 0.07],
    [0.9, 0.17],
    [0.86, 0.33],
    [0.82, 0.45],
    [0.88, 0.51],
    [0.84, 0.65],
    [0.8, 0.77],
    [0.82, 0.84],
    [0.74, 0.92],
    [0.56, 0.97],
    [0, 1]
  ]
  const radiusAt = (t: number) => {
    for (let i = 1; i < control.length; i += 1) {
      const [r1, t1] = control[i]
      if (t <= t1) {
        const [r0, t0] = control[i - 1]
        const k = (t - t0) / Math.max(t1 - t0, 1e-5)
        return r0 + (r1 - r0) * k
      }
    }
    return 0
  }

  const steps = 48
  const points: THREE.Vector2[] = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    points.push(new THREE.Vector2(Math.max(radiusAt(t) * radius, 0.001), t * height))
  }

  const geometry = new THREE.LatheGeometry(points, 128)
  const position = geometry.attributes.position as THREE.BufferAttribute
  const strataDark = new THREE.Color(0x3d1d13)
  const strataLit = new THREE.Color(0x7b3c26)
  const dustCap = new THREE.Color(0xb26b45)
  const colors = new Float32Array(position.count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const py = position.getY(i)
    const angle = Math.atan2(z, x)
    const t = THREE.MathUtils.clamp(py / height, 0, 1)

    // Gullies and buttresses wrap the wall; erosion settles down near the cap.
    const ridge =
      Math.sin(angle * 4 + seed) * 0.55 +
      Math.sin(angle * 9 - seed * 1.7) * 0.3 +
      Math.sin(angle * 19 + seed * 0.4) * 0.15
    const reach = Math.max(1 + ridge * (0.2 - t * 0.13), 0.55)
    // Broken cap: the rim steps down unevenly instead of ending on a flat disc.
    const notch = t > 0.8 ? (t - 0.8) * 0.25 * height * (0.35 + Math.abs(ridge)) : 0

    position.setX(i, x * reach)
    position.setZ(i, z * reach)
    position.setY(i, py - notch)

    const band = 0.5 + 0.5 * Math.sin(py * 1.9 + seed * 2.6)
    color.copy(strataDark).lerp(strataLit, band * 0.8)
    color.lerp(dustCap, THREE.MathUtils.smoothstep(t, 0.7, 0.97) * 0.75)
    color.multiplyScalar(0.9 + ridge * 0.1)
    color.toArray(colors, i * 3)
  }

  position.needsUpdate = true
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, material)
}

// The engine's burn scar: the ring is displaced onto the dunes once, at build
// time, and the TSL material breaks it up with noise so it reads as scorched
// sand instead of a painted disc.
function createBurnScar(cx: number, cz: number, inner: number, outer: number) {
  const scorchGeometry = new THREE.RingGeometry(inner, outer, 64, 8)
  scorchGeometry.rotateX(-Math.PI / 2)
  const baseY = terrainHeight(cx, cz) - 0.12
  const scorchPositions = scorchGeometry.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < scorchPositions.count; i += 1) {
    const x = scorchPositions.getX(i)
    const z = scorchPositions.getZ(i)
    scorchPositions.setY(i, terrainHeight(cx + x, cz + z) - baseY + 0.035)
  }
  scorchPositions.needsUpdate = true

  const scorchMaterial = new NodeMaterial()
  scorchMaterial.transparent = true
  scorchMaterial.depthWrite = false
  scorchMaterial.fog = false

  const vScorch = varying(vec2(0, 0))
  scorchMaterial.vertexNode = Fn(() => {
    vScorch.assign(positionLocal.xz)
    return cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(positionLocal, 1.0))
  })()
  scorchMaterial.fragmentNode = Fn(() => {
    const radius = length(vScorch)
    const band = smoothstep(inner * 0.735, inner * 1.33, radius).mul(
      float(1.0).sub(smoothstep(outer * 0.735, outer, radius))
    )
    const ash = mx_noise_float(vec3(vScorch.mul(4.0), float(0.0)))
      .mul(0.5)
      .add(0.5)
    const intensity = band.mul(ash.mul(0.6).add(0.55))
    return vec4(vec3(0.1, 0.045, 0.03), intensity.mul(0.62))
  })()

  const scorch = new THREE.Mesh(scorchGeometry, scorchMaterial)
  scorch.renderOrder = 1
  scorch.position.set(cx, baseY, cz)
  return scorch
}

// The GLB stores all six wheels as the three material-layer primitives of a
// single "Wheels_objs" node. Re-bucket those triangles into six pivot groups
// centred on each wheel axle so they can roll independently while driving.
function splitWheels(wheelsGroup: THREE.Object3D): THREE.Group[] {
  const pivots = WHEEL_CENTERS.map((center) => {
    const pivot = new THREE.Group()
    pivot.position.copy(center)
    return pivot
  })

  const primitiveMeshes: THREE.Mesh[] = []
  wheelsGroup.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh && mesh.geometry) primitiveMeshes.push(mesh)
  })

  for (const mesh of primitiveMeshes) {
    const indexed = mesh.geometry as THREE.BufferGeometry
    const source = indexed.index ? indexed.toNonIndexed() : indexed
    const position = source.attributes.position as THREE.BufferAttribute
    const normal = source.attributes.normal as THREE.BufferAttribute | undefined
    const uv = source.attributes.uv as THREE.BufferAttribute | undefined

    const triangleBuckets: number[][] = [[], [], [], [], [], []]
    const centroid = new THREE.Vector3()
    for (let i = 0; i < position.count; i += 3) {
      centroid.set(
        (position.getX(i) + position.getX(i + 1) + position.getX(i + 2)) / 3,
        (position.getY(i) + position.getY(i + 1) + position.getY(i + 2)) / 3,
        (position.getZ(i) + position.getZ(i + 1) + position.getZ(i + 2)) / 3
      )
      let best = 0
      let bestDistance = Infinity
      for (let w = 0; w < WHEEL_CENTERS.length; w += 1) {
        const distance = centroid.distanceToSquared(WHEEL_CENTERS[w])
        if (distance < bestDistance) {
          bestDistance = distance
          best = w
        }
      }
      triangleBuckets[best].push(i, i + 1, i + 2)
    }

    for (let w = 0; w < WHEEL_CENTERS.length; w += 1) {
      const vertexIndices = triangleBuckets[w]
      if (vertexIndices.length === 0) continue

      const positions = new Float32Array(vertexIndices.length * 3)
      const normals = normal ? new Float32Array(vertexIndices.length * 3) : null
      const uvs = uv ? new Float32Array(vertexIndices.length * 2) : null
      const center = WHEEL_CENTERS[w]

      for (let k = 0; k < vertexIndices.length; k += 1) {
        const vi = vertexIndices[k]
        positions[k * 3] = position.getX(vi) - center.x
        positions[k * 3 + 1] = position.getY(vi) - center.y
        positions[k * 3 + 2] = position.getZ(vi) - center.z
        if (normals && normal) {
          normals[k * 3] = normal.getX(vi)
          normals[k * 3 + 1] = normal.getY(vi)
          normals[k * 3 + 2] = normal.getZ(vi)
        }
        if (uvs && uv) {
          uvs[k * 2] = uv.getX(vi)
          uvs[k * 2 + 1] = uv.getY(vi)
        }
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      if (normals) geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
      if (uvs) geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

      pivots[w].add(new THREE.Mesh(geometry, mesh.material))
    }

    if (source !== indexed) source.dispose()
    indexed.dispose()
  }

  return pivots
}

interface DriveWaypoint {
  x: number
  z: number
  at: number
  duration: number
}

interface DriveStop {
  at: number
  duration: number
}

interface DriveState {
  roverGroup: THREE.Group
  movable: Movable
  waypoints: DriveWaypoint[]
  stops: DriveStop[]
  index: number
  ready: boolean
  endTime: number
  arrived: boolean
  arriveTime: number
  arrivalHeading: number
  minYOffset: number
  head: THREE.Object3D | null
  headBaseY: number
  sweep: SweepLight | null
  wheels: THREE.Group[]
  wheelWorldRadius: number
}

// Spectral bands the picture-in-picture can show the Earth in. Each band is a
// CSS filter chain applied to the downlink photograph, so switching views costs
// nothing and needs no extra assets.
const SPECTRUM_BANDS = [
  { label: 'VISIBLE', filter: 'none' },
  {
    label: 'THERMAL',
    filter: 'grayscale(1) sepia(1) saturate(2.8) hue-rotate(155deg) contrast(1.15) brightness(1.05)'
  },
  { label: 'RADAR', filter: 'grayscale(1) contrast(1.8) brightness(0.62)' }
]

// Panning is expressed in percent of the monitor width, and is limited so the
// zoomed photograph always covers the viewport.
const clampPan = (x: number, y: number, scale: number) => {
  const limit = ((scale - 1) * 100) / 2
  return {
    x: THREE.MathUtils.clamp(x, -limit, limit),
    y: THREE.MathUtils.clamp(y, -limit, limit)
  }
}

const monitorControlStyle: CSSProperties = {
  width: 20,
  height: 20,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  borderRadius: 4,
  border: '1px solid rgba(126, 203, 255, 0.45)',
  background: 'rgba(5, 18, 28, 0.82)',
  color: '#aef0ff',
  fontSize: 12,
  lineHeight: 1,
  cursor: 'pointer'
}

// The monitor is not a still photograph: once the downlink opens it is pulling
// frames off the rover's carrier, so a decode sweep runs down the picture, a
// ping rings out with every packet and the status bar counts the frames in.
const downlinkKeyframes = `
  @keyframes r3l-downlink-sweep {
    0% { top: -6%; opacity: 0; }
    10% { opacity: 1; }
    88% { opacity: 1; }
    100% { top: 104%; opacity: 0; }
  }
  @keyframes r3l-downlink-ping {
    0% { transform: scale(0.3); opacity: 0.85; }
    70% { opacity: 0.16; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  @keyframes r3l-downlink-blink {
    0%, 55% { opacity: 1; }
    56%, 100% { opacity: 0.18; }
  }
  @keyframes r3l-downlink-bar {
    0%, 100% { transform: scaleY(0.35); }
    40% { transform: scaleY(1); }
    72% { transform: scaleY(0.55); }
  }
`

const downlinkSweepStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 3,
  background:
    'linear-gradient(90deg, rgba(126, 203, 255, 0) 0%, rgba(170, 238, 255, 0.9) 50%, rgba(126, 203, 255, 0) 100%)',
  boxShadow: '0 0 14px rgba(126, 203, 255, 0.55)',
  animation: 'r3l-downlink-sweep 3.4s linear infinite',
  pointerEvents: 'none'
}

const downlinkPingStyle: CSSProperties = {
  position: 'absolute',
  right: 16,
  top: 12,
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid rgba(158, 232, 255, 0.9)',
  animation: 'r3l-downlink-ping 1.7s ease-out infinite',
  pointerEvents: 'none'
}

const downlinkReceiveBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 12px 6px',
  borderTop: '1px solid rgba(126, 203, 255, 0.18)',
  background: 'rgba(5, 18, 28, 0.55)',
  color: '#8fe6ff',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.08em',
  lineHeight: 1
}

const downlinkReceiveDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#66f0c0',
  boxShadow: '0 0 8px #66f0c0',
  animation: 'r3l-downlink-blink 1.1s steps(1, end) infinite'
}

const downlinkBarsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 2,
  height: 11
}

const downlinkBarStyle: CSSProperties = {
  width: 2,
  borderRadius: 1,
  background: '#7ee9ff',
  transformOrigin: 'bottom',
  animation: 'r3l-downlink-bar 1.2s ease-in-out infinite'
}

const downlinkFrameStyle: CSSProperties = {
  marginLeft: 'auto',
  color: 'rgba(174, 240, 255, 0.85)',
  fontVariantNumeric: 'tabular-nums'
}

function DownlinkMonitor({ opacity }: { opacity: number }) {
  // Hover lifts the monitor, a click expands it, the wheel zooms into the
  // photograph, dragging pans while zoomed and double-click resets the view.
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [band, setBand] = useState(0)
  const [reticle, setReticle] = useState<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [frame, setFrame] = useState(0)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{
    pointerId: number
    x: number
    y: number
    panX: number
    panY: number
    moved: boolean
  } | null>(null)
  const suppressClickRef = useRef(false)
  const live = opacity > 0

  // Cleanup on unmount
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    // Native listener: React's wheel handlers are passive, so they cannot
    // cancel the page scroll while zooming the photograph.
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((current) =>
        THREE.MathUtils.clamp(
          Number((current + (event.deltaY < 0 ? 0.25 : -0.25)).toFixed(2)),
          1,
          2.5
        )
      )
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [])

  // Coming back to 1x drops any pan and keeps a fresh zoom inside the frame.
  useEffect(() => {
    setPan((current) => (zoom === 1 ? { x: 0, y: 0 } : clampPan(current.x, current.y, zoom)))
  }, [zoom])

  // While the downlink is open the monitor is actively decoding packets, so the
  // frame counter ticks along with the sweep and the signal bars.
  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => setFrame((value) => value + 1), 640)
    return () => window.clearInterval(timer)
  }, [live])

  const zoomBy = (step: number) => {
    setZoom((current) => THREE.MathUtils.clamp(Number((current + step).toFixed(2)), 1, 2.5))
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false
    }
    setDragging(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setReticle({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100
    })

    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = ((event.clientX - drag.x) / rect.width) * 100
    const dy = ((event.clientY - drag.y) / rect.height) * 100
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true
    if (drag.moved) setPan(clampPan(drag.panX + dx, drag.panY + dy, zoom))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId)
    }
    dragRef.current = null
    setDragging(false)
    if (drag.moved) suppressClickRef.current = true
  }

  const handleToggle = () => {
    // A drag ends with a click too; swallow that one so panning does not resize
    // the monitor under the pointer.
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    setExpanded((value) => !value)
  }

  const longitude = reticle ? reticle.x * 3.6 - 180 : 0
  const latitude = reticle ? 90 - reticle.y * 1.8 : 0

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleToggle}
      onDoubleClick={(event) => {
        event.stopPropagation()
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }}
      role="button"
      tabIndex={live ? 0 : -1}
      aria-label="Earth downlink monitor: click to resize, scroll to zoom, drag to pan"
      style={{
        position: 'absolute',
        left: 24,
        bottom: 24,
        width: expanded ? 460 : 288,
        pointerEvents: live ? 'auto' : 'none',
        cursor: dragging ? 'grabbing' : zoom > 1 ? 'grab' : 'pointer',
        userSelect: 'none',
        zIndex: 10,
        opacity,
        transition:
          'opacity 0.8s ease, width 0.35s ease, transform 0.25s ease, box-shadow 0.25s ease',
        transform: hover ? 'translateY(-6px) scale(1.02)' : 'none',
        background: 'rgba(10, 24, 36, 0.88)',
        border: '1px solid rgba(126, 203, 255, 0.35)',
        borderRadius: 10,
        boxShadow: hover ? '0 18px 44px rgba(0, 0, 0, 0.7)' : '0 12px 32px rgba(0, 0, 0, 0.55)',
        overflow: 'hidden'
      }}
    >
      <style>{downlinkKeyframes}</style>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid rgba(126, 203, 255, 0.22)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: '#cfeaff'
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ff5847',
            boxShadow: '0 0 8px #ff5847'
          }}
        />
        DSN · DEEP SPACE NETWORK
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            setBand((value) => (value + 1) % SPECTRUM_BANDS.length)
          }}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Cycle spectral band"
          style={{
            ...monitorControlStyle,
            marginLeft: 'auto',
            width: 'auto',
            height: 'auto',
            padding: '2px 7px',
            fontSize: 9,
            letterSpacing: '0.08em',
            fontWeight: 700
          }}
        >
          {SPECTRUM_BANDS[band].label}
        </button>
      </div>

      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setReticle(null)}
        // While zoomed the photograph is a pan surface, so a click on it must not
        // collapse the monitor; the header still toggles the size.
        onClick={(event) => {
          if (zoom > 1) event.stopPropagation()
        }}
        style={{
          position: 'relative',
          lineHeight: 0,
          overflow: 'hidden',
          touchAction: zoom > 1 ? 'none' : 'auto'
        }}
      >
        <img
          src="/images/earth/earth-apollo17.jpg"
          alt="Earth from space"
          draggable={false}
          style={{
            width: '100%',
            height: expanded ? 280 : 176,
            objectFit: 'cover',
            display: 'block',
            transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
            filter: SPECTRUM_BANDS[band].filter,
            transition: dragging
              ? 'none'
              : 'transform 0.28s ease, height 0.35s ease, filter 0.35s ease'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,30,50,0.28) 3px)',
            mixBlendMode: 'multiply',
            pointerEvents: 'none'
          }}
        />

        {live && (
          <>
            <div style={downlinkSweepStyle} />
            <div style={downlinkPingStyle} />
          </>
        )}

        {hover && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(5, 18, 28, 0.72)',
              color: 'rgba(174, 240, 255, 0.85)',
              fontSize: 9,
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {zoom > 1 ? 'DOUBLE-CLICK TO RESET' : 'SCROLL TO ZOOM · DRAG TO PAN'}
          </div>
        )}

        {reticle && (
          <div
            style={{
              position: 'absolute',
              left: `${reticle.x}%`,
              top: `${reticle.y}%`,
              width: 28,
              height: 28,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid rgba(174, 240, 255, 0.9)',
              boxShadow: '0 0 10px rgba(90, 220, 255, 0.55)',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: -6,
                width: 1,
                height: 40,
                background: 'rgba(174, 240, 255, 0.55)'
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: -6,
                height: 1,
                width: 40,
                background: 'rgba(174, 240, 255, 0.55)'
              }}
            />
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            pointerEvents: 'none'
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(5, 18, 28, 0.78)',
              color: '#aef0ff',
              fontSize: 10,
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap'
            }}
          >
            EARTH · LIVE
          </span>
          {reticle && (
            <span
              style={{
                color: 'rgba(174, 240, 255, 0.85)',
                fontSize: 9,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
              }}
            >
              {latitude >= 0 ? 'N' : 'S'} {Math.abs(latitude).toFixed(1)}° ·{' '}
              {longitude >= 0 ? 'E' : 'W'} {Math.abs(longitude).toFixed(1)}°
            </span>
          )}
          <div
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              pointerEvents: 'auto'
            }}
          >
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomBy(-0.25)}
              style={monitorControlStyle}
            >
              −
            </button>
            <span style={{ color: '#aef0ff', fontSize: 9, minWidth: 30, textAlign: 'center' }}>
              {zoom.toFixed(2)}×
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomBy(0.25)}
              style={monitorControlStyle}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div style={downlinkReceiveBarStyle}>
        <span style={downlinkReceiveDotStyle} />
        RECEIVING
        <div style={downlinkBarsStyle}>
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              style={{
                ...downlinkBarStyle,
                height: 4 + index * 2.4,
                animationDelay: `${index * 0.16}s`
              }}
            />
          ))}
        </div>
        <span style={downlinkFrameStyle}>
          FRM {String(frame % 10000).padStart(4, '0')} · 8.42 kbps
        </span>
      </div>
    </div>
  )
}

// The loupe that rides above the fern patch. R3L's Popup pins a DOM card to a
// world position through a CSS2DObject, so the specimen stays glued to the find
// under both renderers; the patch texture is blown up inside a round aperture
// so the find on the rim reads at instrument scale instead of as a green smudge.
const LOUPE_WIDTH = 188
const LOUPE_VIEW = 144
const LOUPE_TEXTURE = '/models/fern_02/textures/fern_02_diff_1k.jpg'

const loupeKeyframes = `
  @keyframes r3l-loupe-drift {
    0% { transform: scale(1.04) translate3d(0, 0, 0); }
    50% { transform: scale(1.14) translate3d(-4px, -6px, 0); }
    100% { transform: scale(1.04) translate3d(0, 0, 0); }
  }
  @keyframes r3l-loupe-scan {
    0% { top: -4%; opacity: 0; }
    12% { opacity: 1; }
    88% { opacity: 1; }
    100% { top: 104%; opacity: 0; }
  }
`

const loupeRootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: LOUPE_WIDTH,
  pointerEvents: 'none',
  userSelect: 'none'
}

const loupeCardStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 8,
  borderRadius: 10,
  background: 'rgba(8, 22, 20, 0.9)',
  border: '1px solid rgba(142, 240, 184, 0.36)',
  boxShadow: '0 14px 34px rgba(0, 0, 0, 0.6)'
}

const loupeHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 6,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: '#cdfbe0'
}

const loupeDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: '#8ef0b8',
  boxShadow: '0 0 8px #8ef0b8'
}

const loupeViewportStyle: CSSProperties = {
  position: 'relative',
  width: LOUPE_VIEW,
  height: LOUPE_VIEW,
  margin: '0 auto',
  borderRadius: '50%',
  overflow: 'hidden',
  background: '#0d1f16',
  boxShadow: 'inset 0 0 18px rgba(0, 0, 0, 0.9), 0 0 12px rgba(142, 240, 184, 0.16)'
}

// One frond of the Poly Haven atlas, blown up until the pinnae read as leaves.
const loupeSpecimenStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${LOUPE_TEXTURE})`,
  backgroundSize: '560%',
  backgroundPosition: '37% 62%',
  filter: 'saturate(1.3) contrast(1.12) brightness(1.08)',
  animation: 'r3l-loupe-drift 14s ease-in-out infinite'
}

const loupeGridStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: '50%',
  background:
    'radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.64) 100%), repeating-linear-gradient(rgba(0, 0, 0, 0) 0px, rgba(0, 0, 0, 0) 2px, rgba(0, 26, 16, 0.34) 3px)',
  pointerEvents: 'none'
}

const loupeScanBarStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 2,
  background:
    'linear-gradient(90deg, rgba(142, 240, 184, 0) 0%, rgba(142, 240, 184, 0.85) 50%, rgba(142, 240, 184, 0) 100%)',
  animation: 'r3l-loupe-scan 5.5s linear infinite',
  pointerEvents: 'none'
}

const loupeFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 6,
  fontSize: 8,
  letterSpacing: '0.12em',
  color: 'rgba(174, 240, 255, 0.72)'
}

const loupeStalkStyle: CSSProperties = {
  width: 1,
  height: 20,
  background: 'linear-gradient(rgba(142, 240, 184, 0.9), rgba(142, 240, 184, 0.05))'
}

const loupeAnchorStyle: CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: '#8ef0b8',
  boxShadow: '0 0 8px #8ef0b8'
}

function SpecimenLoupe() {
  return (
    <>
      <style>{loupeKeyframes}</style>
      <div style={loupeRootStyle}>
        <div style={loupeCardStyle}>
          <div style={loupeHeaderStyle}>
            <span style={loupeDotStyle} />
            LOUPE
            <span style={{ marginLeft: 'auto', color: '#8ef0b8' }}>×8.0</span>
          </div>
          <div style={loupeViewportStyle}>
            <div style={loupeSpecimenStyle} />
            <div style={loupeGridStyle} />
            <div style={loupeScanBarStyle} />
            <svg
              width={LOUPE_VIEW}
              height={LOUPE_VIEW}
              viewBox="0 0 128 128"
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0 }}
            >
              <circle
                cx="64"
                cy="64"
                r="43"
                fill="none"
                stroke="rgba(142, 240, 184, 0.4)"
                strokeWidth="0.8"
                strokeDasharray="3 8"
              />
              <path
                d="M64 12v12M64 104v12M12 64h12M104 64h12"
                stroke="rgba(142, 240, 184, 0.75)"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div style={loupeFooterStyle}>
            <span>FERN PATCH · 01</span>
            <span style={{ color: '#8ef0b8' }}>LIVE SCAN</span>
          </div>
        </div>
        <div style={loupeStalkStyle} />
        <div style={loupeAnchorStyle} />
      </div>
    </>
  )
}

export default function ComplexSceneDemo({
  rendererType = 'webgpu',
  captions = DEFAULT_CAPTIONS
}: ComplexSceneDemoProps = {}) {
  const extraRef = useRef<THREE.Object3D[]>([])
  const roverRef = useRef<THREE.Object3D | null>(null)
  const driveRef = useRef<DriveState | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const scanRef = useRef<RadarSweep | null>(null)
  const signalWavesRef = useRef<SignalWave | null>(null)
  const linkLightRef = useRef<THREE.PointLight | null>(null)
  const plantRef = useRef<THREE.Group | null>(null)
  const loupeRef = useRef<Popup | null>(null)
  const lastLoupeOpacityRef = useRef(0)
  const disposedRef = useRef(false)
  const previousTimeRef = useRef<number | null>(null)
  const captionTitleRef = useRef<HTMLDivElement | null>(null)
  const lastCaptionRef = useRef('')
  // The frame loop is captured once, so it reads the captions through a ref
  // that tracks the latest locale's strings.
  const captionsRef = useRef(captions)
  captionsRef.current = captions

  // The DSN downlink monitor is its own interactive component; the scene only
  // reports how strongly it should be showing through (0 while the beam is
  // dark, 1 once the downlink goes live).
  const [pipOpacity, setPipOpacity] = useState(0)
  const lastPipOpacityRef = useRef(0)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light, controls } = components
    sceneRef.current = scene

    // Pulled back so both the drive start on the open plain and the crater rim
    // stay inside the frame while the rover makes its descent.
    camera.position.set(14, 6.5, 9)
    camera.lookAt(-2, 0.9, -12.5)

    if (controls) {
      controls.target.set(-2, 0.9, -12.5)
      controls.enableDamping = true
      controls.dampingFactor = 0.06
      controls.enablePan = false
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.3
      controls.minDistance = 10
      controls.maxDistance = 60
      controls.minPolarAngle = 0.35
      controls.maxPolarAngle = Math.PI * 0.48
      controls.update()
    }

    light.traverse((child) => {
      const lightChild = child as THREE.Light
      if (!lightChild.isLight) return
      if ((lightChild as THREE.DirectionalLight).isDirectionalLight) {
        const directional = lightChild as THREE.DirectionalLight
        directional.position.copy(SUN_DIRECTION).multiplyScalar(60)
        directional.color.set('#ffb27a')
        directional.intensity = 2.8
      } else if ((lightChild as THREE.AmbientLight).isAmbientLight) {
        lightChild.intensity = 0.3
      }
    })

    const hemisphere = new THREE.HemisphereLight(0x8a3f26, 0x180c09, 0.95)
    scene.add(hemisphere)
    extraRef.current.push(hemisphere)

    // Sky dome, replaces the default scene background. Its radius has to stay
    // outside the widened terrain but inside the camera far plane.
    const sky = new SkyDome({
      radius: 900,
      sunDirection: [SUN_DIRECTION.x, SUN_DIRECTION.y, SUN_DIRECTION.z]
    })
    scene.add(sky)
    extraRef.current.push(sky)

    // --- Terrain: dust plain with the impact crater ------------------------
    const terrainGeometry = new THREE.PlaneGeometry(1100, 1100, 512, 512)
    terrainGeometry.rotateX(-Math.PI / 2)
    const positions = terrainGeometry.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(positions.count * 3)
    const lowColor = new THREE.Color('#4a1d13')
    const midColor = new THREE.Color('#a5502d')
    const highColor = new THREE.Color('#dd9663')
    const dustColor = new THREE.Color('#d9a274')
    const sampleColor = new THREE.Color()

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const y = terrainHeight(x, z)
      positions.setY(i, y)

      // Colour from the terrain's own height, ignoring the horizon curve so the
      // far plain keeps the same regolith tone instead of fading to shadow.
      const elevation = THREE.MathUtils.smoothstep(
        y - terrainCurvature(x, z),
        -2.4,
        1.2
      )
      sampleColor.lerpColors(lowColor, midColor, elevation)
      sampleColor.lerp(
        highColor,
        THREE.MathUtils.smoothstep(y - terrainCurvature(x, z), 0.3, 1.8) * 0.7
      )

      // The crater interior sits in shadow, darker than the sunlit plain.
      const inside = THREE.MathUtils.clamp(
        1 - Math.hypot(x - CRATER.x, z - CRATER.z) / CRATER.radius,
        0,
        1
      )
      sampleColor.multiplyScalar(1 - inside * 0.3)

      // Dune crests are scoured lighter than the troughs, so the ridges read as
      // blown sand instead of a flat coloured plain.
      const flatten = THREE.MathUtils.smoothstep(
        Math.hypot(x - ROVER.x, z - ROVER.z),
        3.2,
        12
      )
      sampleColor.lerp(
        dustColor,
        THREE.MathUtils.smoothstep(duneCrest(x, z), 0.2, 1) * 0.18 * flatten
      )

      // Thin wind streaks of pale dust over the rust regolith.
      const streak = 0.5 + 0.5 * Math.sin(x * 0.8 + z * 0.55)
      sampleColor.lerp(dustColor, streak * 0.12)

      colors[i * 3] = sampleColor.r
      colors[i * 3 + 1] = sampleColor.g
      colors[i * 3 + 2] = sampleColor.b
    }
    terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    terrainGeometry.computeVertexNormals()

    // The detail map is tiled roughly every 25 units, small enough to read as
    // grain underfoot and large enough to survive the camera's orbit.
    const regolithTexture = createRegolithTexture()
    regolithTexture?.repeat.set(44, 44)

    const terrain = new THREE.Mesh(
      terrainGeometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: regolithTexture ?? undefined,
        roughness: 1,
        metalness: 0.02
      })
    )
    scene.add(terrain)
    extraRef.current.push(terrain)

    // --- Distant mesas behind the crater ----------------------------------
    const mesaMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
      metalness: 0.02
    })
    const mesas: Array<[number, number, number, number]> = [
      [-46, -72, 20, 11],
      [48, -66, 15, 8],
      [-88, -24, 13, 7],
      [12, -108, 24, 12],
      [96, -88, 16, 9],
      [-110, -96, 18, 10]
    ]
    mesas.forEach(([x, z, height, radius], index) => {
      const mesa = createMassif(height, radius, 3.1 + index * 1.9, mesaMaterial)
      mesa.position.set(x, terrainHeight(x, z) - 1, z)
      mesa.rotation.y = Math.atan2(x, z)
      scene.add(mesa)
      extraRef.current.push(mesa)
    })

    // --- Mars cargo lander on the far plain ---------------------------------
    // The transfer ship that carried Qiusuo to Mars: NASA's own Viking lander
    // model, downloaded from the 3D Resources hub. It is a 1.8 MB glTF of nine
    // PBR materials, scaled up on the plain so the ship dwarfs the rover, and
    // the scorched ring of its descent burn is baked into the dunes around it.
    const landerGroup = new THREE.Group()
    landerGroup.position.set(LANDER.x, terrainHeight(LANDER.x, LANDER.z), LANDER.z)
    landerGroup.rotation.y = Math.atan2(ROVER.x - LANDER.x, ROVER.z - LANDER.z)
    scene.add(landerGroup)
    extraRef.current.push(landerGroup)

    void GLTFLoaderAsync('/models/viking-lander.glb', false)
      .then((model) => {
        if (disposedRef.current) {
          disposeModel(model)
          return
        }

        // Scale by height: the model's leg span follows from its own
        // proportions, so the ship stays in shape at any size.
        const bounds = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        bounds.getSize(size)
        model.scale.setScalar(LANDER_HEIGHT / Math.max(size.y, 0.001))

        // Rest the footpads on the group's local ground plane.
        bounds.setFromObject(model)
        model.position.set(0, -bounds.min.y, 0)
        landerGroup.add(model)
      })

    // The scar is wider than the sixteen-unit leg span, so the ring still shows
    // beyond the footpads the way a real descent burn would.
    const landerScar = createBurnScar(LANDER.x, LANDER.z, 4.6, 11)
    scene.add(landerScar)
    extraRef.current.push(landerScar)

    // --- Scattered rocks ---------------------------------------------------
    // Real rock silhouettes instead of a dodecahedron: three asteroid shape
    // models published on https://science.nasa.gov/3d-resources/ (1999 RQ36 /
    // Bennu, 1620 Geographos, 4179 Toutatis), decimated into one GLB. Their
    // geometry is cloned out so it survives disposing the loaded model.
    void GLTFLoaderAsync('/models/mars-rocks.glb', false)
      .then((model) => {
        if (disposedRef.current) {
          disposeModel(model)
          return
        }

        const rockGeometries: THREE.BufferGeometry[] = []
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return
          const geometry = child.geometry.clone()
          if (geometry.getAttribute('normal') === undefined) {
            geometry.computeVertexNormals()
          }
          // Normalise every shape to a half-extent of 1 so the scatter scales
          // below keep the same meaning they had for the old boulders.
          geometry.computeBoundingBox()
          const bounds = geometry.boundingBox
          if (bounds) {
            const size = new THREE.Vector3()
            const center = new THREE.Vector3()
            bounds.getSize(size)
            bounds.getCenter(center)
            const longest = Math.max(size.x, size.y, size.z, 0.001)
            geometry.translate(-center.x, -center.y, -center.z)
            geometry.scale(2 / longest, 2 / longest, 2 / longest)
          }
          rockGeometries.push(geometry)
        })
        // Only the clones are kept, so the parsed model can be released now.
        disposeModel(model)
        if (rockGeometries.length === 0) return

        const random = createRandom(20240607)
        const rockMaterials = [0x6d3320, 0x83402a, 0x55271b].map(
          (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true })
        )
        // Keep the drive path clear so the rover does not plough through stones.
        const pathSamples: THREE.Vector3[] = []
        for (let i = 0; i <= 200; i += 1) {
          pathSamples.push(DRIVE_CURVE.getPointAt(i / 200))
        }
        const distanceToPath = (x: number, z: number) => {
          let nearest = Infinity
          for (const sample of pathSamples) {
            const distance = Math.hypot(x - sample.x, z - sample.z)
            if (distance < nearest) nearest = distance
          }
          return nearest
        }

        // Every stone the field will hold: shape, tint, resting tilt, and the
        // size of the footprint it covers.
        const placements: Array<{
          shape: number
          material: number
          x: number
          z: number
          scale: THREE.Vector3
          rotation: THREE.Euler
        }> = []

        const addStone = (x: number, z: number, size: number, clearance: number) => {
          if (Math.hypot(x - STATION.x, z - STATION.z) < 4.6) return
          if (Math.hypot(x - PLANT.x, z - PLANT.z) < 2.2) return
          if (Math.hypot(x - ROVER.x, z - ROVER.z) < 2.4) return
          if (Math.hypot(x - LANDER.x, z - LANDER.z) < 13) return
          if (distanceToPath(x, z) < clearance) return

          placements.push({
            shape: Math.floor(random() * rockGeometries.length),
            material: Math.floor(random() * rockMaterials.length),
            x,
            z,
            // Stones settle a little wider than they are tall, the way broken
            // rock beds into sand.
            scale: new THREE.Vector3(
              size * (0.8 + random() * 0.5),
              size * (0.55 + random() * 0.45),
              size
            ),
            rotation: new THREE.Euler(
              (random() - 0.5) * 0.5,
              random() * Math.PI * 2,
              (random() - 0.5) * 0.5
            )
          })
        }

        // Boulders out across the dune plain.
        for (let i = 0; i < 80; i += 1) {
          const angle = random() * Math.PI * 2
          const radius = 7 + random() * 95
          addStone(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0.45 + random() * 1.25,
            2.2
          )
        }

        // Pebbles and grit around the play area: small, dense and close enough
        // to give the ground a real sense of scale under the rover.
        for (let i = 0; i < 260; i += 1) {
          const angle = random() * Math.PI * 2
          const radius = 2.5 + Math.pow(random(), 0.7) * 34
          addStone(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0.05 + random() * 0.22,
            0.9
          )
        }

        // Scree fields: fans of debris gathered below the dune crests.
        for (let i = 0; i < 18; i += 1) {
          const angle = random() * Math.PI * 2
          const radius = 6 + random() * 52
          const centreX = Math.cos(angle) * radius
          const centreZ = Math.sin(angle) * radius
          const count = 4 + Math.floor(random() * 5)
          for (let k = 0; k < count; k += 1) {
            const spread = 0.5 + random() * 2.4
            const offset = random() * Math.PI * 2
            addStone(
              centreX + Math.cos(offset) * spread,
              centreZ + Math.sin(offset) * spread,
              0.14 + random() * 0.32,
              1.1
            )
          }
        }

        // One instanced mesh per shape and tint keeps the whole stone field at a
        // handful of draw calls instead of several hundred.
        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        rockGeometries.forEach((geometry, shape) => {
          rockMaterials.forEach((material, materialIndex) => {
            const batch = placements.filter(
              (stone) => stone.shape === shape && stone.material === materialIndex
            )
            if (batch.length === 0) return

            const stones = new THREE.InstancedMesh(geometry, material, batch.length)
            batch.forEach((stone, index) => {
              // Sink the stone into the sand so it looks bedded in the regolith
              // rather than dropped on top of it.
              position.set(
                stone.x,
                terrainHeight(stone.x, stone.z) + stone.scale.y * 0.55,
                stone.z
              )
              quaternion.setFromEuler(stone.rotation)
              matrix.compose(position, quaternion, stone.scale)
              stones.setMatrixAt(index, matrix)
            })
            stones.instanceMatrix.needsUpdate = true
            stones.computeBoundingSphere()
            scene.add(stones)
            extraRef.current.push(stones)
          })
        })
      })
      .catch(() => {
        // The rocks are scenery: if the asset cannot be fetched the story
        // still plays with the rest of the scene.
      })

    // --- Downlink beacon ----------------------------------------------------
    // The relay station the rover reports to is marked by the light above it;
    // the signal itself is broadcast by the vehicle.
    const stationY = terrainHeight(STATION.x, STATION.z)

    const linkLight = new THREE.PointLight(0x74e8ff, 0, 18, 2)
    linkLight.position.set(STATION.x, stationY + 2.6, STATION.z)
    scene.add(linkLight)
    extraRef.current.push(linkLight)
    linkLightRef.current = linkLight

    // --- Fern patch (Poly Haven, CC0) -------------------------------------
    // NASA's catalogue has no biology, so the living specimen is a CC0 fern
    // patch from Poly Haven (https://polyhaven.com/a/fern_02). It sits on the
    // near rim crest beside the parked rover and opens up out of the regolith
    // while the downlink goes live.
    const plantY = terrainHeight(PLANT.x, PLANT.z)

    const plantPivot = new THREE.Group()
    plantPivot.position.set(PLANT.x, plantY, PLANT.z)
    plantPivot.rotation.y = 0.7
    plantPivot.scale.setScalar(0.45)
    scene.add(plantPivot)
    extraRef.current.push(plantPivot)
    plantRef.current = plantPivot

    void GLTFLoaderAsync('/models/fern_02/fern_02_1k.glb', false)
      .then((model) => {
        if (disposedRef.current) {
          disposeModel(model)
          return
        }

        // Normalise the metre-authored patch to the size the story needs; the
        // group already stands on the ground because the fronds grow from y=0.
        const bounds = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        bounds.getSize(size)
        model.scale.setScalar(PLANT_WIDTH / Math.max(size.x, size.z, 0.001))
        plantPivot.add(model)
      })
      .catch(() => {
        // The patch is scenery: without the asset the story still plays out.
      })

    // The loupe: a Popup card whose anchor dot sits just above the patch, so
    // the specimen is called out at instrument scale while the rover's own
    // callout stays where it is.
    const loupe = new Popup([PLANT.x, plantY + 0.62, PLANT.z], <SpecimenLoupe />)
    if (loupe.scene) {
      loupe.scene.center.set(0.5, 1)
      loupe.scene.element.style.opacity = '0'
      loupe.scene.element.style.pointerEvents = 'none'
      scene.add(loupe.scene)
    }
    loupeRef.current = loupe

    // --- Rover (NASA/JPL-Caltech) -----------------------------------------

    // The rover drives itself with R3L's Movable: the group carries the
    // heading and the horizontal position, terrain following below owns the
    // height. Yaw-then-pitch order keeps the pitch aligned with the heading.
    const roverGroup = new THREE.Group()
    roverGroup.rotation.order = 'YXZ'
    scene.add(roverGroup)
    const movable = new Movable(roverGroup, [DRIVE_START.x, 0, DRIVE_START.z])
    const drive: DriveState = {
      roverGroup,
      movable,
      waypoints: [],
      stops: [],
      index: 0,
      ready: false,
      endTime: Infinity,
      arrived: false,
      arriveTime: 0,
      arrivalHeading: 0,
      minYOffset: 0,
      head: null,
      headBaseY: 0,
      sweep: null,
      wheels: [],
      wheelWorldRadius: WHEEL_RADIUS
    }
    driveRef.current = drive

    void GLTFLoaderAsync('/models/perseverance-draco.glb', true)
      .then((model) => {
        if (disposedRef.current) {
          disposeModel(model)
          return
        }

        const bounds = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        bounds.getSize(size)
        const maxDimension = Math.max(size.x, size.y, size.z, 0.001)
        model.scale.setScalar(2.8 / maxDimension)

        bounds.setFromObject(model)
        // Lift the model so its wheels rest on the group's local ground plane.
        const minYOffset = -bounds.min.y
        model.position.set(0, minYOffset, 0)
        // The group carries the heading; the model stays unrotated inside it.

        const currentDrive = driveRef.current
        if (!currentDrive) {
          disposeModel(model)
          return
        }

        currentDrive.roverGroup.add(model)
        currentDrive.minYOffset = minYOffset
        currentDrive.head = model.getObjectByName('head') ?? null
        currentDrive.headBaseY = currentDrive.head ? currentDrive.head.rotation.y : 0

        // Re-pivot the six wheels so they can spin while driving instead of
        // staying fused with the static suspension.
        const wheelsGroup = model.getObjectByName('Wheels_objs')
        if (wheelsGroup) {
          currentDrive.wheels = splitWheels(wheelsGroup)
          currentDrive.wheelWorldRadius = WHEEL_RADIUS * model.scale.x
          wheelsGroup.clear()
          currentDrive.wheels.forEach((wheel) => wheelsGroup.add(wheel))
        }

        // Park facing the first leg, then schedule the survey route as a
        // wall-clock waypoint list (one issued per frame at most).
        const first = DRIVE_CURVE.getPointAt(1 / DRIVE_WAYPOINTS)
        currentDrive.roverGroup.rotation.y = Math.atan2(
          first.x - DRIVE_START.x,
          first.z - DRIVE_START.z
        )

        let at = performance.now() + 1500
        const previous = DRIVE_START.clone()
        let stopIndex = 0
        for (let i = 1; i <= DRIVE_WAYPOINTS; i += 1) {
          const point = DRIVE_CURVE.getPointAt(i / DRIVE_WAYPOINTS)
          const length = Math.hypot(point.x - previous.x, point.z - previous.z)
          const duration = (length / DRIVE_SPEED) * 1000
          currentDrive.waypoints.push({ x: point.x, z: point.z, at, duration })
          at += duration
          previous.set(point.x, 0, point.z)

          // A survey station: the rover halts there for a spell, then rolls on.
          if (stopIndex < DRIVE_STOPS.length && i / DRIVE_WAYPOINTS >= DRIVE_STOPS[stopIndex].t) {
            currentDrive.stops.push({ at, duration: DRIVE_STOPS[stopIndex].dwell })
            at += DRIVE_STOPS[stopIndex].dwell
            stopIndex += 1
          }
        }
        currentDrive.endTime = at
        currentDrive.ready = true

        roverRef.current = model
      })
      .catch(() => {
        // If the model cannot be fetched, still play the downlink on time
        // instead of freezing the story before the rover parks.
        const currentDrive = driveRef.current
        if (currentDrive && !disposedRef.current) {
          currentDrive.ready = true
          currentDrive.endTime = performance.now() + 800
        }
      })

    // --- Signal wave launched from the vehicle toward Earth ----------------
    // A stream of signal pulses instead of a solid line: each arc leaves the
    // rover's mast, swells as it climbs along the Earth bearing and fades out,
    // so the broadcast reads as coming from the vehicle itself. The wave
    // animates itself along the bearing and stays hidden until the fern is
    // found; from that beat on, the demo re-anchors its origin to the rover
    // every frame so the stream stays glued to the vehicle.
    const roverY = terrainHeight(ROVER.x, ROVER.z)
    const signalOrigin = new THREE.Vector3(ROVER.x, roverY + 1.7, ROVER.z)
    const signalWaves = new SignalWave({
      bearing: [EARTH_DIRECTION.x, EARTH_DIRECTION.y, EARTH_DIRECTION.z],
      origin: [signalOrigin.x, signalOrigin.y, signalOrigin.z],
      travel: SIGNAL_TRAVEL,
      period: SIGNAL_TRAVEL / SIGNAL_SPEED,
      count: SIGNAL_RING_COUNT,
      startScale: SIGNAL_PULSE_START,
      endScale: SIGNAL_PULSE_END
    })
    signalWaves.visible = false
    scene.add(signalWaves)
    signalWavesRef.current = signalWaves

    // --- The pale blue dot of Earth, a faint star in the black sky ---------
    // The realistic full-disk Earth lives in the picture-in-picture DSN
    // downlink overlay instead of being approximated here in 3D.
    const earthDot = new GlowSprite({ size: 3.2 })
    earthDot.position.copy(EARTH_DIRECTION).multiplyScalar(EARTH_DISTANCE)
    scene.add(earthDot)
    extraRef.current.push(earthDot)
  }

  // Narrative controller: dispatches drive waypoints, follows the terrain,
  // pivots the rover into its survey pose, then lights the downlink.
  const handleBeforeFrame = () => {
    const now = performance.now()
    const previousTime = previousTimeRef.current
    const dt = previousTime === null ? 0 : Math.min((now - previousTime) / 1000, 0.05)
    previousTimeRef.current = now

    const drive = driveRef.current
    let speedFactor = 0
    let activeStop: DriveStop | null = null

    if (drive && drive.ready) {
      // A survey station pause: while a dwell window is open the rover holds
      // still, wheels locked, and works its instruments.
      for (const stop of drive.stops) {
        if (now >= stop.at && now < stop.at + stop.duration) {
          activeStop = stop
          break
        }
      }
      const dwelling = activeStop !== null

      // Issue the next scheduled waypoint, at most one per frame so an
      // overdue schedule (e.g. after a hidden tab) catches up gradually.
      if (drive.index < drive.waypoints.length && now >= drive.waypoints[drive.index].at) {
        const waypoint = drive.waypoints[drive.index]
        drive.movable.moveTo([waypoint.x, 0, waypoint.z], waypoint.duration)
        drive.index += 1
      }

      if (!drive.arrived && now >= drive.endTime) {
        drive.arrived = true
        drive.arriveTime = now
        drive.arrivalHeading = drive.roverGroup.rotation.y
      }
      // Motion-driven details (bob, pitch) ease out after parking and stop
      // outright while the rover is halted at a survey station.
      if (drive.arrived) {
        speedFactor = 1 - THREE.MathUtils.smoothstep(now - drive.arriveTime, 0, 1200)
      } else {
        speedFactor = dwelling ? 0 : 1
      }

      const group = drive.roverGroup
      // Terrain following: Movable owns X/Z and heading, this owns the height.
      const groundY = terrainHeight(group.position.x, group.position.z)
      group.position.y = groundY + Math.sin(now / 85) * 0.02 * speedFactor

      // Pitch to match the slope ahead along the current heading.
      const forwardX = Math.sin(group.rotation.y)
      const forwardZ = Math.cos(group.rotation.y)
      const hAhead = terrainHeight(
        group.position.x + forwardX * 1.1,
        group.position.z + forwardZ * 1.1
      )
      const hBehind = terrainHeight(
        group.position.x - forwardX * 1.1,
        group.position.z - forwardZ * 1.1
      )
      const targetPitch = THREE.MathUtils.clamp((hBehind - hAhead) / 2.2, -0.13, 0.13) * speedFactor
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetPitch, 0.08)

      if (drive.arrived) {
        // Pivot into the survey pose facing the relay station.
        const pivot = THREE.MathUtils.smoothstep(now - drive.arriveTime - 400, 0, 2400)
        let headingDelta = SURVEY_HEADING - drive.arrivalHeading
        headingDelta = Math.atan2(Math.sin(headingDelta), Math.cos(headingDelta))
        group.rotation.y = drive.arrivalHeading + headingDelta * pivot
      }

      // The mast works the ground: a slow pan while halted at a survey station
      // or parked on the rim, and a return to its stowed heading on the move.
      // On parking it first spreads: the head swings out of its stowed heading
      // across the rim in one wide pass and gathers back onto the site, so the
      // rover's own camera opens the scene up before the downlink begins.
      if (drive.head) {
        if (drive.arrived) {
          const spreadT = THREE.MathUtils.clamp(
            (now - drive.arriveTime - MAST_SPREAD_DELAY) / MAST_SPREAD_DURATION,
            0,
            1
          )
          const spread = Math.sin(Math.PI * spreadT) * MAST_SPREAD_ANGLE
          const scan = THREE.MathUtils.smoothstep(now - drive.arriveTime - 2600, 0, 1200)
          drive.head.rotation.y = drive.headBaseY + spread + Math.sin(now / 1700) * 0.55 * scan
        } else if (dwelling) {
          drive.head.rotation.y = drive.headBaseY + Math.sin(now / 950) * 0.42
        } else {
          drive.head.rotation.y = THREE.MathUtils.lerp(drive.head.rotation.y, drive.headBaseY, 0.05)
        }
      }

      // A scan beat from R3L's SweepLight washes over the hull while the
      // instruments work at each station, and once more after parking.
      const sweeping =
        dwelling ||
        (drive.arrived && now >= drive.arriveTime + 1200 && now < drive.arriveTime + 7000)
      if (sweeping && !drive.sweep && group.children.length > 0) {
        drive.sweep = new SweepLight(group, {
          color: 0x6fe6ff,
          speed: 0.6,
          width: 0.25,
          intensity: 1.1,
          direction: 2,
          loop: THREE.LoopPingPong
        })
      }
      if (!sweeping && drive.sweep) {
        drive.sweep.dispose()
        drive.sweep = null
      }

      // Ground radar: a ring pulse rolls out from under the rover while it
      // holds at a survey station, sounding the sand for the sample. The sweep
      // is displaced onto the world terrain, so it leaves the rover group and
      // is parked at the rover's ground position before it enters the scene.
      if (activeStop && !scanRef.current) {
        const scan = new RadarSweep({
          radius: SCAN_RADIUS,
          heightAt: terrainHeight,
          period: SCAN_PERIOD,
          color: 0x6fdcff,
          opacity: 0.85
        })
        scan.position.set(group.position.x, groundY, group.position.z)
        sceneRef.current?.add(scan)
        scanRef.current = scan
      } else if (!activeStop && scanRef.current) {
        scanRef.current.parent?.remove(scanRef.current)
        scanRef.current.dispose()
        scanRef.current = null
      }

      // Roll the six wheels only while the rover is actually driving: the
      // first waypoint is the 1.5s wind-up, station halts and parking lock them.
      if (drive.wheels.length > 0 && drive.index > 0 && !drive.arrived && !dwelling) {
        const roll = ((DRIVE_SPEED * speedFactor) / drive.wheelWorldRadius) * dt
        if (roll !== 0) {
          for (const wheel of drive.wheels) wheel.rotation.x += roll
        }
      }
    }

    // Downlink reveal: the rover's signal pulses and the beacon light come up
    // once the rover has parked and the link is being acquired.
    const reveal =
      drive && drive.arrived
        ? THREE.MathUtils.smoothstep(now - drive.arriveTime - 1600, 0, 1800)
        : 0
    const pulse = 0.5 + 0.5 * Math.sin(now / 260)

    if (linkLightRef.current) {
      linkLightRef.current.intensity = (7 + pulse * 5) * reveal
    }
    // The fern patch is already there when the rover parks, then opens up a
    // beat after the downlink lights up so the living specimen reads as the
    // payoff of the link rather than scenery.
    if (plantRef.current) {
      plantRef.current.scale.setScalar(0.45 + 0.55 * THREE.MathUtils.smoothstep(reveal, 0.45, 0.95))
    }
    // The loupe opens up with the specimen and then stays lit on the rim.
    const loupe = loupeRef.current
    if (loupe?.scene) {
      const loupeOpacity = THREE.MathUtils.smoothstep(reveal, 0.62, 0.95)
      if (Math.abs(loupeOpacity - lastLoupeOpacityRef.current) > 0.004) {
        lastLoupeOpacityRef.current = loupeOpacity
        loupe.scene.element.style.opacity = String(loupeOpacity)
      }
    }
    // Signal waves: silent until Qiusuo finds the fern, then the pulses animate
    // themselves along the Earth bearing with their origin re-anchored to the
    // mast every frame - so from the discovery beat on, the stream stays glued
    // to the vehicle and broadcasts the find.
    const signalWaves = signalWavesRef.current
    if (signalWaves) {
      if (drive) {
        signalWaves.setOrigin(
          drive.roverGroup.position.x,
          drive.roverGroup.position.y + 1.7,
          drive.roverGroup.position.z
        )
      }
      signalWaves.visible = reveal >= 0.55
    }

    // Storytelling: a cinematic caption walks the viewer through the mission,
    // and the DSN downlink picture-in-picture arrives when the beam to Earth
    // goes live. Driven through refs so the once-captured frame callback never
    // needs to re-render this component.
    let caption = captionsRef.current.intro
    let captionOpacity = 1
    let targetPipOpacity = 0

    if (drive && drive.ready) {
      if (!drive.arrived) {
        caption = activeStop ? captionsRef.current.survey : captionsRef.current.driving
        captionOpacity = 1
      } else if (now - drive.arriveTime < 2600) {
        caption = captionsRef.current.parked
        captionOpacity = 1
      } else if (reveal < 0.55) {
        caption = captionsRef.current.acquiring
        captionOpacity = 1
      } else if (reveal < 0.85) {
        caption = captionsRef.current.finding
        captionOpacity = 1
      } else {
        caption = captionsRef.current.downlink
        captionOpacity = 0.95
        targetPipOpacity = 1
      }
    }

    const captionTitle = captionTitleRef.current
    if (captionTitle) {
      if (lastCaptionRef.current !== caption) {
        lastCaptionRef.current = caption
        captionTitle.textContent = caption
      }
      captionTitle.style.opacity = String(captionOpacity)
    }
    // The monitor fades in once the downlink goes live; only touch React state
    // when the target actually changes so the frame loop stays allocation-free.
    if (lastPipOpacityRef.current !== targetPipOpacity) {
      lastPipOpacityRef.current = targetPipOpacity
      setPipOpacity(targetPipOpacity)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    disposedRef.current = false
    return () => {
      disposedRef.current = true

      const drive = driveRef.current
      if (drive) {
        drive.sweep?.dispose()
        drive.sweep = null
        drive.movable.dispose()
        drive.roverGroup.parent?.remove(drive.roverGroup)
        driveRef.current = null
      }

      signalWavesRef.current?.dispose()
      signalWavesRef.current = null

      scanRef.current?.dispose()
      scanRef.current = null

      sceneRef.current = null

      if (loupeRef.current) {
        loupeRef.current.scene?.parent?.remove(loupeRef.current.scene)
        loupeRef.current.dispose()
        loupeRef.current = null
        lastLoupeOpacityRef.current = 0
      }

      if (roverRef.current) {
        disposeModel(roverRef.current)
        roverRef.current.parent?.remove(roverRef.current)
        roverRef.current = null
      }

      linkLightRef.current = null

      plantRef.current = null

      extraRef.current.forEach((object) => {
        object.parent?.remove(object)
        disposeObject(object)
      })
      extraRef.current = []
    }
  }, [])

  return (
    <>
      <Scene
        rendererType={rendererType}
        bgColor="rgb(16, 8, 8)"
        axesHelper={false}
        gridHelper={false}
        style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        onCreated={handleCreated}
        onBeforeFrame={handleBeforeFrame}
      >
        <HeightFog
          fogColor="#b5724a"
          fogDensity={0.016}
          fogHeight={7}
          fogHeightFalloff={0.4}
          fogMaxOpacity={0.55}
          noiseStrength={0.5}
          noiseScale={0.018}
          noiseSpeedX={0.05}
          noiseSpeedZ={0.02}
          inscatteringColor="#ffb27a"
          inscatteringIntensity={1}
          lightAzimuth={232}
          lightElevation={11}
        />
        <Snow
          count={9000}
          color="#d9a37a"
          speed={0.42}
          range={70}
          height={24}
          windX={1.5}
          windZ={0.6}
          opacity={0.34}
        />
      </Scene>

      {/* Cinematic storytelling caption (bottom centre, above the orbit hint). */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: 84,
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          maxWidth: 'min(90vw, 720px)'
        }}
      >
        <div
          ref={captionTitleRef}
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
            transition: 'opacity 0.45s ease'
          }}
        />
      </div>

      {/* Picture-in-picture DSN downlink monitor showing the real Earth. */}
      <DownlinkMonitor opacity={pipOpacity} />
    </>
  )
}
