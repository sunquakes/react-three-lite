import * as THREE from 'three'
import {
  Fn,
  Loop,
  atan,
  cameraPosition,
  clamp,
  cos,
  dot,
  exp,
  float,
  fract,
  length,
  max,
  min,
  mix,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  reflect,
  sin,
  smoothstep,
  step,
  texture,
  uniform,
  vec2,
  vec3
} from 'three/tsl'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import type { Node, UniformNode } from 'three/webgpu'
import { fbmNode, microGradientNode } from './WaterShading'
import {
  BEACH_CIRCUMFERENCE,
  BEACH_DOME_HEIGHT,
  BEACH_DOME_RADIUS,
  BEACH_FOOTPRINT_LIFETIME,
  BEACH_RADIUS
} from './BeachTerrain'
import { BEACH_FOOTPRINT_CAPACITY } from './BeachFootprints'
import type { BeachPresetState } from './BeachPresets'

/** Radius of the sky dome, in world units. The camera stays well inside. */
export const BEACH_SKY_RADIUS = 4200
/** Outer radius of the ocean ring. */
export const BEACH_OCEAN_RADIUS = 4000

export interface BeachUniforms {
  time: UniformNode<'float', number>
  wetLine: UniformNode<'float', number>
  sunDirection: UniformNode<'vec3', THREE.Vector3>
  sunColor: UniformNode<'vec3', THREE.Vector3>
  zenith: UniformNode<'vec3', THREE.Vector3>
  horizon: UniformNode<'vec3', THREE.Vector3>
  horizonSun: UniformNode<'vec3', THREE.Vector3>
  mid: UniformNode<'vec3', THREE.Vector3>
  glow: UniformNode<'vec3', THREE.Vector3>
  cloudSun: UniformNode<'vec3', THREE.Vector3>
  cloudShade: UniformNode<'vec3', THREE.Vector3>
  sand: UniformNode<'vec3', THREE.Vector3>
  waterDeep: UniformNode<'vec3', THREE.Vector3>
  waterShallow: UniformNode<'vec3', THREE.Vector3>
  sunDisk: UniformNode<'float', number>
  discSize: UniformNode<'float', number>
  night: UniformNode<'float', number>
  sunLight: UniformNode<'float', number>
}

const vectorUniform = (hex: string): UniformNode<'vec3', THREE.Vector3> => {
  const color = new THREE.Color(hex)
  return uniform(new THREE.Vector3(color.r, color.g, color.b))
}

export function createBeachUniforms(): BeachUniforms {
  return {
    time: uniform(0),
    wetLine: uniform(1.1),
    sunDirection: uniform(new THREE.Vector3(0, 0.2, 1).normalize()),
    sunColor: vectorUniform('#ffca8a'),
    zenith: vectorUniform('#1054a4'),
    horizon: vectorUniform('#b296ac'),
    horizonSun: vectorUniform('#fcb06e'),
    mid: vectorUniform('#eeca9f'),
    glow: vectorUniform('#ffc77a'),
    cloudSun: vectorUniform('#ffd7b0'),
    cloudShade: vectorUniform('#8f8fae'),
    sand: vectorUniform('#cdb698'),
    waterDeep: vectorUniform('#0b2f4a'),
    waterShallow: vectorUniform('#3d7f84'),
    sunDisk: uniform(2.4),
    discSize: uniform(1.2),
    night: uniform(0),
    sunLight: uniform(1.35)
  }
}

const setVector = (target: UniformNode<'vec3', THREE.Vector3>, color: THREE.Color) => {
  target.value.set(color.r, color.g, color.b)
}

/** Copies a blended preset snapshot into the shader uniforms. */
export function applyBeachPresetToUniforms(
  uniforms: BeachUniforms,
  state: BeachPresetState
): void {
  uniforms.sunDirection.value.copy(state.sunDirection)
  setVector(uniforms.sunColor, state.sunColor)
  setVector(uniforms.zenith, state.zenith)
  setVector(uniforms.horizon, state.horizon)
  setVector(uniforms.horizonSun, state.horizonSun)
  setVector(uniforms.mid, state.mid)
  setVector(uniforms.glow, state.glow)
  setVector(uniforms.cloudSun, state.cloudSun)
  setVector(uniforms.cloudShade, state.cloudShade)
  setVector(uniforms.sand, state.sand)
  setVector(uniforms.waterDeep, state.waterDeep)
  setVector(uniforms.waterShallow, state.waterShallow)
  uniforms.sunDisk.value = state.sunDisk
  uniforms.discSize.value = state.discSize
  uniforms.night.value = state.night
  uniforms.sunLight.value = state.sunLight
}

/**
 * Analytic sky: horizon/mid/zenith gradient, sun-side glow, fbm clouds,
 * a crisp sun or moon disc and a star field at night. Water and wet sand use
 * the same function for their reflections.
 */
function beachSkyColorNode(
  direction: Node<'vec3'>,
  uniforms: BeachUniforms,
  noiseMap: THREE.Texture
): Node<'vec3'> {
  const dir = normalize(direction)
  const up = clamp(dir.y, -0.08, 1)
  const horizonMix = smoothstep(-0.02, 0.3, up)
  const zenithMix = smoothstep(0.1, 0.9, up)

  let sky: Node<'vec3'> = mix(uniforms.horizon, uniforms.mid, horizonMix)
  sky = mix(sky, uniforms.zenith, zenithMix)

  const sunAlignment = max(dot(dir, uniforms.sunDirection), 0)
  const horizonFade = clamp(float(1).sub(up.mul(1.5)), 0, 1)
  sky = sky.add(uniforms.horizonSun.mul(pow(sunAlignment, 4).mul(horizonFade).mul(0.55)))
  sky = sky.add(uniforms.glow.mul(pow(sunAlignment, 24).mul(0.4)))

  // Cloud layer projected on a plane above the viewer.
  const cloudUv = dir.xz
    .div(max(dir.y, 0.08))
    .mul(0.6)
    .add(vec2(uniforms.time.mul(0.0045), uniforms.time.mul(0.0016)))
  const density = fbmNode(cloudUv, noiseMap)
  const cloudShape = smoothstep(0.46, 0.68, density)
  const cloudFade = smoothstep(-0.02, 0.18, dir.y).mul(float(1).sub(uniforms.night.mul(0.55)))
  const cloudLight = smoothstep(-0.25, 0.95, dot(dir, uniforms.sunDirection))
  const cloudColor = mix(uniforms.cloudShade, uniforms.cloudSun, cloudLight)
  const cloudAlpha = cloudShape.mul(cloudFade).mul(0.85)
  sky = mix(sky, cloudColor, cloudAlpha)

  // Sun / moon disc with a soft limb and a faint halo.
  const halfAngle = uniforms.discSize.mul(Math.PI / 360)
  const disc = smoothstep(cos(halfAngle.mul(1.4)), cos(halfAngle.mul(0.65)), sunAlignment)
  sky = sky.add(uniforms.sunColor.mul(disc.mul(uniforms.sunDisk)))
  sky = sky.add(uniforms.sunColor.mul(pow(sunAlignment, 220).mul(0.6)))

  // Sparse twinkling stars, only at night.
  const starUv = dir.xz.div(max(dir.y, 0.06)).mul(88)
  const starCell = starUv.floor()
  const starLocal = fract(starUv).sub(0.5)
  const starHash = fract(sin(dot(starCell, vec2(12.9898, 78.233))).mul(43758.5453))
  const starBright = smoothstep(0.62, 0.98, starHash)
  const starPoint = float(1).sub(smoothstep(0.04, 0.14, length(starLocal)))
  const twinkle = float(0.65).add(sin(uniforms.time.mul(1.7).add(starHash.mul(63))).mul(0.35))
  const starMask = smoothstep(0.02, 0.24, dir.y).mul(uniforms.night)
  sky = sky.add(
    vec3(0.82, 0.88, 1).mul(starPoint.mul(starBright).mul(twinkle).mul(starMask).mul(1.7))
  )

  return sky
}

const beachHeightNode = (u: Node<'float'>): Node<'float'> => {
  const shore = clamp(u, 0, 2.8).mul(0.22)
  const inland = max(u.sub(2.8), 0).mul(0.08)
  const radius = float(BEACH_RADIUS).sub(u)
  const domeRatio = min(radius.abs().div(BEACH_DOME_RADIUS), 1)
  const dome = pow(float(1).sub(domeRatio.mul(domeRatio)), 2).mul(BEACH_DOME_HEIGHT)
  const bed = min(u, 0).mul(0.22)
  return shore.add(inland).add(dome).add(bed)
}

const beachSandNormalNode = (
  positionXZ: Node<'vec2'>,
  radius: Node<'float'>,
  u: Node<'float'>,
  noiseMap: THREE.Texture
): Node<'vec3'> => {
  const epsilon = 0.35
  const slope = beachHeightNode(u.add(epsilon)).sub(beachHeightNode(u)).div(epsilon)
  const radial = positionXZ.div(radius)
  const base = normalize(vec3(slope.mul(radial.x), 1, slope.mul(radial.y)))

  const rippleX = fbmNode(positionXZ.mul(0.9).add(vec2(13.7, 4.1)), noiseMap).sub(0.5)
  const rippleZ = fbmNode(positionXZ.mul(0.9).add(vec2(-7.3, 21.9)), noiseMap).sub(0.5)
  return normalize(base.add(vec3(rippleX.mul(0.24), 0, rippleZ.mul(0.24))))
}

interface SwellComponent {
  wavelength: number
  amplitude: number
  angle: number
}

const SWELLS: SwellComponent[] = [
  { wavelength: 42, amplitude: 0.16, angle: 0 },
  { wavelength: 26, amplitude: 0.1, angle: 0.18 },
  { wavelength: 15, amplitude: 0.06, angle: -0.24 }
]

/** Radial swells rolling towards the shore, plus their height gradient. */
const beachSwellNodes = (
  positionXZ: Node<'vec2'>,
  timeNode: Node<'float'>
): { height: Node<'float'>; gradient: Node<'vec2'> } => {
  const radius = max(length(positionXZ), 0.001)
  const inward = positionXZ.div(radius).negate()

  let height: Node<'float'> = float(0)
  let gradient: Node<'vec2'> = vec2(0)

  SWELLS.forEach(({ wavelength, amplitude, angle }) => {
    const rotated = vec2(
      inward.x.mul(Math.cos(angle)).sub(inward.y.mul(Math.sin(angle))),
      inward.x.mul(Math.sin(angle)).add(inward.y.mul(Math.cos(angle)))
    )
    const waveNumber = (2 * Math.PI) / wavelength
    const omega = Math.sqrt(9.81 * waveNumber) * 0.8
    const phase = dot(positionXZ, rotated).mul(waveNumber).add(timeNode.mul(omega))

    height = height.add(sin(phase).mul(amplitude))
    gradient = gradient.add(rotated.mul(cos(phase)).mul(amplitude * waveNumber))
  })

  const u = float(BEACH_RADIUS).sub(radius)
  const shoal = smoothstep(-170, -20, u)
  const swash = float(1).sub(smoothstep(-1.4, -0.04, u))
  const fade = shoal.mul(swash)

  return {
    height: height.mul(fade),
    gradient: gradient.mul(fade)
  }
}

/**
 * Footprint mask for the sand shader: reads the 24 texel ring buffer and
 * rebuilds a heel + forefoot shape per foot in shore coordinates.
 */
const beachFootprintMaskNode = (
  positionXZ: Node<'vec2'>,
  uInland: Node<'float'>,
  uniforms: BeachUniforms,
  footprintTexture: THREE.DataTexture
): Node<'float'> => {
  const theta = atan(positionXZ.y, positionXZ.x)
  const s = theta.add(Math.PI).div(2 * Math.PI).mul(BEACH_CIRCUMFERENCE)
  const mask = float(0).toVar()

  Loop(BEACH_FOOTPRINT_CAPACITY, ({ i }) => {
    const texel = texture(
      footprintTexture,
      vec2(float(i).add(0.5).div(BEACH_FOOTPRINT_CAPACITY), 0.5)
    )
    const age = uniforms.time.sub(texel.w)
    const alive = step(float(0), age)
    const life = float(1).sub(
      smoothstep(BEACH_FOOTPRINT_LIFETIME - 60, BEACH_FOOTPRINT_LIFETIME, age)
    )

    const ds = fract(s.sub(texel.x).div(BEACH_CIRCUMFERENCE).add(0.5))
      .sub(0.5)
      .mul(BEACH_CIRCUMFERENCE)
    const du = uInland.sub(texel.y)
    const heading = texel.z
    const forward = ds.mul(cos(heading)).add(du.mul(sin(heading)))
    const lateral = du.mul(cos(heading)).sub(ds.mul(sin(heading)))

    // Slight scalloping along the toe edge reads as five toes at this scale.
    const toeEdge = forward.sub(0.058).div(0.088).add(cos(lateral.mul(150)).mul(0.05))
    const forefoot = length(vec2(toeEdge, lateral.div(0.052)))
    const heel = length(vec2(forward.add(0.086).div(0.046), lateral.div(0.038)))
    const shape = float(1).sub(smoothstep(0.84, 1.08, min(forefoot, heel)))

    const wash = smoothstep(uniforms.wetLine.sub(0.4), uniforms.wetLine.add(1.1), uInland)
    mask.addAssign(shape.mul(life).mul(alive).mul(wash))
  })

  return clamp(mask, 0, 1)
}

export interface CreateBeachMaterialsOptions {
  uniforms: BeachUniforms
  noiseMap: THREE.Texture
  footprintTexture: THREE.DataTexture
}

export interface BeachMaterials {
  sky: MeshBasicNodeMaterial
  sand: MeshBasicNodeMaterial
  water: MeshBasicNodeMaterial
}

/** Creates the three node materials that make up the scene. */
export function createBeachMaterials({
  uniforms,
  noiseMap,
  footprintTexture
}: CreateBeachMaterialsOptions): BeachMaterials {
  const skyColor = (direction: Node<'vec3'>) => beachSkyColorNode(direction, uniforms, noiseMap)

  const sky = new MeshBasicNodeMaterial({ name: 'SandyBeachSky' })
  sky.side = THREE.BackSide
  sky.depthWrite = false
  sky.colorNode = Fn(() => skyColor(normalize(positionWorld.sub(cameraPosition))))()

  const sand = new MeshBasicNodeMaterial({ name: 'SandyBeachSand' })
  sand.side = THREE.DoubleSide

  sand.positionNode = Fn(() => {
    const radius = max(length(positionLocal.xz), 0.001)
    const u = float(BEACH_RADIUS).sub(radius)
    return vec3(positionLocal.x, beachHeightNode(u), positionLocal.z)
  })()

  sand.colorNode = Fn(() => {
    const worldPosition = positionWorld
    const radius = max(length(worldPosition.xz), 0.001)
    const u = float(BEACH_RADIUS).sub(radius)
    const normal = beachSandNormalNode(worldPosition.xz, radius, u, noiseMap)

    const grain = fbmNode(worldPosition.xz.mul(2.4), noiseMap)
    const fineGrain = fbmNode(worldPosition.xz.mul(11).add(vec2(4.2, -7.3)), noiseMap)
    let color: Node<'vec3'> = uniforms.sand.mul(
      float(0.8).add(grain.mul(0.32)).add(fineGrain.mul(0.12))
    )

    const wetMask = float(1).sub(
      smoothstep(uniforms.wetLine.sub(0.6), uniforms.wetLine.add(3.2), u)
    )
    const dampMask = float(1).sub(
      smoothstep(uniforms.wetLine.add(2.5), uniforms.wetLine.add(7.5), u)
    )
    color = color.mul(float(1).sub(dampMask.mul(0.1)))

    const footprint = beachFootprintMaskNode(
      worldPosition.xz,
      u,
      uniforms,
      footprintTexture
    )
    color = color.mul(float(1).sub(wetMask.mul(0.22)).sub(footprint.mul(0.26)))

    const viewDirection = normalize(cameraPosition.sub(worldPosition))
    const wet = clamp(wetMask.add(footprint.mul(0.7)), 0, 1)
    const fresnel = pow(float(1).sub(clamp(viewDirection.y, 0, 1)), 5).mul(0.85)
    const reflected = skyColor(reflect(viewDirection.negate(), normalize(normal)))
    color = mix(color, reflected, wet.mul(fresnel.add(0.03)))

    const sunDiffuse = max(dot(normal, uniforms.sunDirection), 0)
    const ambient = mix(vec3(0.3, 0.34, 0.42), vec3(0.045, 0.06, 0.095), uniforms.night)
    const direct = uniforms.sunColor.mul(sunDiffuse.mul(uniforms.sunLight).mul(0.6))
    color = color.mul(ambient.add(direct))

    const sparkle = pow(
      max(dot(reflect(viewDirection.negate(), normal), uniforms.sunDirection), 0),
      10
    )
    color = color.add(
      uniforms.sunColor.mul(
        sparkle.mul(fineGrain).mul(uniforms.sunLight).mul(float(1).sub(wet)).mul(0.7)
      )
    )

    return color
  })()

  const water = new MeshBasicNodeMaterial({ name: 'SandyBeachWater' })
  water.side = THREE.DoubleSide

  water.positionNode = Fn(() => {
    const swell = beachSwellNodes(positionLocal.xz, uniforms.time)
    return vec3(positionLocal.x, swell.height, positionLocal.z)
  })()

  water.colorNode = Fn(() => {
    const worldPosition = positionWorld
    const radius = max(length(worldPosition.xz), 0.001)
    const u = float(BEACH_RADIUS).sub(radius)
    const distanceToCamera = length(cameraPosition.xz.sub(worldPosition.xz))

    const swell = beachSwellNodes(worldPosition.xz, uniforms.time)
    const micro = microGradientNode(worldPosition.xz, distanceToCamera, uniforms.time, noiseMap)
    const normal = normalize(
      vec3(swell.gradient.x.add(micro.x).negate(), 1, swell.gradient.y.add(micro.y).negate())
    )

    const deepMix = float(1).sub(smoothstep(-38, -3, u))
    let color: Node<'vec3'> = mix(uniforms.waterShallow, uniforms.waterDeep, deepMix)

    const viewDirection = normalize(cameraPosition.sub(worldPosition))
    const cosView = clamp(dot(viewDirection, normal), 0, 1)
    const fresnel = clamp(
      float(0.02).add(pow(float(1).sub(cosView), 5).mul(0.98)),
      0,
      1
    )
    const reflected = skyColor(reflect(viewDirection.negate(), normal))
    color = mix(color, reflected, fresnel)

    const specular = pow(
      max(dot(reflect(viewDirection.negate(), normal), uniforms.sunDirection), 0),
      720
    )
    color = color.add(uniforms.sunColor.mul(specular.mul(uniforms.sunLight).mul(2.4)))

    const lace = fbmNode(
      worldPosition.xz.mul(1.1).add(vec2(uniforms.time.mul(0.05), uniforms.time.mul(-0.03))),
      noiseMap
    )
    const shoreFoam = smoothstep(-3.2, -0.15, u).mul(smoothstep(0.5, 0.72, lace)).mul(0.9)
    const whitecaps = smoothstep(0.62, 0.8, lace).mul(smoothstep(-90, -25, u)).mul(0.32)
    const foam = clamp(shoreFoam.add(whitecaps), 0, 0.9)
    const foamColor = mix(
      vec3(0.9, 0.93, 0.95),
      vec3(0.12, 0.15, 0.2),
      uniforms.night
    )
    color = mix(color, foamColor, foam)

    const haze = float(1).sub(exp(distanceToCamera.mul(-0.0011)))
    return mix(color, uniforms.horizon, haze.mul(0.9))
  })()

  return { sky, sand, water }
}

/** Ring of sand from the island center out to the waterline. */
export function createBeachSandGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.RingGeometry(0.002, BEACH_RADIUS, 256, 48)
  geometry.rotateX(-Math.PI / 2)
  geometry.name = 'SandyBeachSand'
  return geometry
}

/** Ocean ring with rings packed towards the shore so swells stay smooth. */
export function createBeachWaterGeometry(): THREE.BufferGeometry {
  const innerRadius = BEACH_RADIUS - 0.8
  const outerRadius = BEACH_OCEAN_RADIUS
  const angularSegments = 256
  const radialSegments = 72

  const positions = new Float32Array(angularSegments * (radialSegments + 1) * 3)
  const indices: number[] = []

  for (let ring = 0; ring <= radialSegments; ring += 1) {
    const radius =
      innerRadius * Math.pow(outerRadius / innerRadius, ring / radialSegments)
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const theta = (segment / angularSegments) * Math.PI * 2
      const offset = (ring * angularSegments + segment) * 3
      positions[offset] = Math.cos(theta) * radius
      positions[offset + 1] = 0
      positions[offset + 2] = Math.sin(theta) * radius
    }
  }

  for (let ring = 0; ring < radialSegments; ring += 1) {
    for (let segment = 0; segment < angularSegments; segment += 1) {
      const next = (segment + 1) % angularSegments
      const a = ring * angularSegments + segment
      const b = ring * angularSegments + next
      const c = (ring + 1) * angularSegments + segment
      const d = (ring + 1) * angularSegments + next
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.name = 'SandyBeachWater'
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  return geometry
}
