import * as THREE from 'three'
import { MeshBasicNodeMaterial, type Node } from 'three/webgpu'
import {
  Fn,
  If,
  abs,
  cameraPosition,
  clamp,
  dot,
  float,
  frontFacing,
  length,
  max,
  min,
  mix,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  reflect,
  refract,
  select,
  sign,
  smoothstep,
  sqrt,
  texture,
  vec2,
  vec3
} from 'three/tsl'

/**
 * Ray traced materials for the interactive water pool.
 *
 * The shading follows Evan Wallace's original webgl-water demo: the water
 * surface, the basin floor and the floating boxes are all shaded in the
 * fragment shader with analytic rays, so the effect renders identically with
 * the WebGPU and the WebGL backend and does not need any render targets.
 *
 * @see https://madebyevan.com/webgl-water/
 */
export interface WaterPoolBoxNodes {
  /** Uniform holding the world position of the box center. */
  center: Node<'vec3'>
  /** Uniform holding the box half extents. */
  halfSize: Node<'vec3'>
  /** Uniform holding the box color. */
  color: Node<'vec3'>
}

export interface WaterPoolMaterialOptions {
  /** Half float RGBA texture: height, velocity, normal.x, normal.z. */
  waterTexture: THREE.Texture
  /** RGBA texture storing the caustic light map in the red channel. */
  causticTexture: THREE.Texture
  /** Boxes floating in the pool, sharing the same ray traced shading. */
  boxes: WaterPoolBoxNodes[]
  /** Uniform holding the normalized direction towards the sun. */
  lightDirection: Node<'vec3'>
  /** Uniform holding the world position of the pool surface centre. */
  poolCenter: Node<'vec3'>
  /** Uniform holding the uniform scale applied to the pool. */
  poolScale: Node<'float'>
}

export interface WaterPoolMaterials {
  water: MeshBasicNodeMaterial
  pool: MeshBasicNodeMaterial
  boxes: MeshBasicNodeMaterial[]
  sky: MeshBasicNodeMaterial
}

const IOR_AIR = 1
const IOR_WATER = 1.333
const SURFACE_TO_AIR = IOR_AIR / IOR_WATER
const AIR_TO_SURFACE = IOR_WATER / IOR_AIR
const POOL_FLOOR_Y = -1
const RAY_MISS = 1e6

/**
 * Absorption applied to light that travels through the water. It is kept mild
 * so that the different box colors stay readable under the surface, and it is
 * only applied once per ray (applying it twice crushes the red channel and
 * turns every box blue).
 */
const waterTintColor = vec3(0.7, 0.92, 1.0)
const underwaterTintColor = vec3(0.62, 0.86, 1.0)

interface ShadingContext {
  waterTexture: THREE.Texture
  causticTexture: THREE.Texture
  boxes: WaterPoolBoxNodes[]
  lightDirection: Node<'vec3'>
  poolCenter: Node<'vec3'>
  poolScale: Node<'float'>
}

/**
 * World point expressed in the pool's own space, where the surface centre is
 * the origin, the floor sits at y = -1 and the outline fits into -1…1. The pool
 * mesh is a scaled and translated group, so every ray is traced in this space
 * and the shading does not depend on where the pool is placed.
 */
function poolSpacePointNode(
  point: Node<'vec3'>,
  context: ShadingContext
): Node<'vec3'> {
  return point.sub(context.poolCenter).div(context.poolScale)
}

/** Direction the sunlight travels after entering the flat water surface. */
function refractedSunlightNode(lightDirection: Node<'vec3'>): Node<'vec3'> {
  return refract(lightDirection.negate(), vec3(0, 1, 0), SURFACE_TO_AIR)
}

/**
 * Surface coordinate that the refracted sunlight reaching `point` passed
 * through. The caustic map is indexed by surface coordinate, so a floor point
 * looks up the map exactly where its own sun ray entered the water.
 */
function causticUvNode(point: Node<'vec3'>, lightDirection: Node<'vec3'>): Node<'vec2'> {
  const refracted = refractedSunlightNode(lightDirection)
  return point.xz.sub(refracted.xz.mul(point.y).div(refracted.y)).mul(0.5).add(0.5)
}

/** Procedural sky used by the background dome and by the water reflections. */
export function waterPoolSkyColorNode(
  ray: Node<'vec3'>,
  lightDirection: Node<'vec3'>
): Node<'vec3'> {
  const height = clamp(ray.y, -1, 1)
  const gradient = mix(
    vec3(0.58, 0.76, 0.94),
    vec3(0.16, 0.42, 0.78),
    smoothstep(0, 0.65, height)
  )
  const horizonGlow = mix(
    vec3(0.92, 0.9, 0.82),
    vec3(0, 0, 0),
    smoothstep(0, 0.22, abs(height))
  ).mul(0.35)
  const sunAlignment = max(dot(ray, lightDirection), 0)
  const sunDisc = pow(sunAlignment, 1400).mul(6)
  const sunHalo = pow(sunAlignment, 28).mul(0.28)

  return gradient
    .add(horizonGlow)
    .add(vec3(1.0, 0.9, 0.72).mul(sunDisc))
    .add(vec3(1.0, 0.82, 0.58).mul(sunHalo))
}

/**
 * Distance along `ray` to the near face of an axis aligned box, or `RAY_MISS`
 * when the ray does not hit it.
 */
function intersectBoxNode(
  origin: Node<'vec3'>,
  ray: Node<'vec3'>,
  center: Node<'vec3'>,
  halfSize: Node<'vec3'>
): Node<'float'> {
  const tMin = center.sub(halfSize).sub(origin).div(ray)
  const tMax = center.add(halfSize).sub(origin).div(ray)
  const near = min(tMin, tMax)
  const far = max(tMin, tMax)
  const tNear = max(max(near.x, near.y), near.z)
  const tFar = min(min(far.x, far.y), far.z)

  return select(
    tNear.greaterThan(0).and(tNear.lessThan(tFar)),
    tNear,
    float(RAY_MISS)
  )
}

/** Outward normal of the box face that contains `point`. */
function boxNormalNode(
  point: Node<'vec3'>,
  center: Node<'vec3'>,
  halfSize: Node<'vec3'>
): Node<'vec3'> {
  const local = point.sub(center)
  const distance = abs(local).div(halfSize)
  const normal = vec3(0).toVar()

  If(distance.x.greaterThan(distance.y).and(distance.x.greaterThan(distance.z)), () => {
    normal.assign(vec3(sign(local.x), 0, 0))
  })
    .ElseIf(distance.y.greaterThan(distance.z), () => {
      normal.assign(vec3(0, sign(local.y), 0))
    })
    .Else(() => {
      normal.assign(vec3(0, 0, sign(local.z)))
    })

  return normal
}

/** Shading of a floating box, matching the original sphere shading. */
function boxColorNode(
  point: Node<'vec3'>,
  box: WaterPoolBoxNodes,
  context: ShadingContext
): Node<'vec3'> {
  const halfSize = box.halfSize
  const color = box.color.toVar()

  // Ambient occlusion against the basin, mirroring the original demo.
  const aoX = float(1).sub(
    float(0.9).div(pow(float(1).add(halfSize.x).sub(abs(point.x)).div(halfSize.x), 3))
  )
  const aoZ = float(1).sub(
    float(0.9).div(pow(float(1).add(halfSize.z).sub(abs(point.z)).div(halfSize.z), 3))
  )
  const aoY = float(1).sub(
    float(0.9).div(pow(point.y.add(1).add(halfSize.y).div(halfSize.y), 3))
  )
  color.mulAssign(aoX.mul(aoZ).mul(aoY))

  const normal = boxNormalNode(point, box.center, halfSize)
  const sunlight = refractedSunlightNode(context.lightDirection).negate()
  const diffuse = max(dot(sunlight, normal), 0)
  const waterHeight = texture(context.waterTexture, point.xz.mul(0.5).add(0.5)).r
  const light = float(0.45).add(diffuse.mul(0.35)).toVar()

  If(point.y.lessThan(waterHeight), () => {
    const caustic = texture(
      context.causticTexture,
      causticUvNode(point, context.lightDirection)
    ).r
    light.addAssign(diffuse.mul(caustic).mul(1.6))
  })
  // Modulate the box color instead of adding white light, otherwise bright
  // caustics desaturate every box into the same pale cyan.
  color.mulAssign(light)

  const viewDirection = normalize(poolSpacePointNode(cameraPosition, context).sub(point))
  const halfVector = normalize(viewDirection.add(context.lightDirection))
  const specular = pow(max(dot(normal, halfVector), 0), 96).mul(0.35)
  const reflection = waterPoolSkyColorNode(
    reflect(viewDirection.negate(), normal),
    context.lightDirection
  ).mul(0.16)
  color.addAssign(vec3(specular))
  color.addAssign(reflection)

  return color
}

/** Shading of the basin floor, with caustics and box occlusion. */
function basinColorNode(point: Node<'vec3'>, context: ShadingContext): Node<'vec3'> {
  // Plain floor color: no tile grid, only the caustics and shadows vary it.
  const color = vec3(0.59, 0.77, 0.78)
  const normal = vec3(0, 1, 0)

  const scale = float(0.5).div(length(point)).toVar()

  // Darken the basin right below a box, using the nearest box surface.
  const boxDistance = float(1e6).toVar()
  context.boxes.forEach((box) => {
    boxDistance.assign(
      min(boxDistance, length(point.sub(box.center).div(box.halfSize)))
    )
  })
  scale.mulAssign(float(1).sub(float(0.9).div(pow(max(boxDistance, 1), 4))))

  const sunlight = refractedSunlightNode(context.lightDirection).negate()
  const diffuse = max(dot(sunlight, normal), 0)
  const waterHeight = texture(context.waterTexture, point.xz.mul(0.5).add(0.5)).r

  If(point.y.lessThan(waterHeight), () => {
    const caustic = texture(
      context.causticTexture,
      causticUvNode(point, context.lightDirection)
    ).r
    // Every box blocks the refracted sunlight and casts a soft shadow on the
    // basin, which also darkens the part of the caustic web behind it.
    const shadow = float(1).toVar()
    context.boxes.forEach((box) => {
      const toBox = box.center.sub(point)
      const alongSun = max(dot(toBox, sunlight), 0)
      const perpendicular = length(toBox.sub(sunlight.mul(alongSun)))
      const radius = length(box.halfSize)
      shadow.mulAssign(
        mix(
          float(0.35),
          float(1),
          smoothstep(radius.mul(0.7), radius.mul(1.45), perpendicular)
        )
      )
    })
    scale.addAssign(diffuse.mul(caustic).mul(2).mul(shadow))
  }).Else(() => {
    scale.addAssign(diffuse.mul(0.35))
  })

  return color.mul(scale)
}

/**
 * Color seen when a water ray leaves the surface, tracing the boxes, the basin
 * floor or the sky depending on where the ray goes.
 */
function surfaceRayColorNode(
  origin: Node<'vec3'>,
  ray: Node<'vec3'>,
  context: ShadingContext
): Node<'vec3'> {
  const color = vec3(0).toVar()
  const nearest = float(RAY_MISS).toVar()
  const hitColor = vec3(0).toVar()

  context.boxes.forEach((box) => {
    const boxHit = intersectBoxNode(origin, ray, box.center, box.halfSize)
    If(boxHit.lessThan(nearest), () => {
      nearest.assign(boxHit)
      hitColor.assign(boxColorNode(origin.add(ray.mul(boxHit)), box, context))
    })
  })

  If(nearest.lessThan(RAY_MISS * 0.5), () => {
    color.assign(hitColor)
  }).Else(() => {
    If(ray.y.lessThan(0), () => {
      // Downward rays reach the flat basin floor. The pool has no basin wall,
      // so upward rays escape through the open top towards the sky.
      const floorHit = float(POOL_FLOOR_Y).sub(origin.y).div(ray.y)
      color.assign(basinColorNode(origin.add(ray.mul(floorHit)), context))
    }).Else(() => {
      color.assign(waterPoolSkyColorNode(ray, context.lightDirection))
    })
  })

  // Absorb the light exactly once for rays travelling through the water, so a
  // refracted box is not tinted once here and again by the caller.
  If(ray.y.lessThan(0), () => {
    color.mulAssign(waterTintColor)
  })

  return color
}

/** Samples the height field and reconstructs the rippled surface normal. */
function waterNormalNode(
  waterTexture: THREE.Texture,
  point: Node<'vec3'>
): Node<'vec3'> {
  let coord: Node<'vec2'> = point.xz.mul(0.5).add(0.5)
  let info = texture(waterTexture, coord)

  // The original demo walks a few steps along the normal so that ripples read
  // as sharp peaks instead of soft bumps.
  for (let index = 0; index < 5; index += 1) {
    coord = coord.add(vec2(info.b, info.a).mul(0.005))
    info = texture(waterTexture, coord)
  }

  const normalX = info.b
  const normalZ = info.a
  const normalY = sqrt(max(float(1).sub(normalX.mul(normalX)).sub(normalZ.mul(normalZ)), 0))

  return vec3(normalX, normalY, normalZ)
}

/** Creates all node materials used by the water pool. */
export function createWaterPoolMaterials(
  options: WaterPoolMaterialOptions
): WaterPoolMaterials {
  const context: ShadingContext = {
    waterTexture: options.waterTexture,
    causticTexture: options.causticTexture,
    boxes: options.boxes,
    lightDirection: options.lightDirection,
    poolCenter: options.poolCenter,
    poolScale: options.poolScale
  }

  const water = new MeshBasicNodeMaterial()
  water.name = 'WaterPoolSurface'
  water.side = THREE.DoubleSide
  water.positionNode = Fn(() => {
    const uvCoord = positionLocal.xz.mul(0.5).add(0.5)
    const height = texture(context.waterTexture, uvCoord).r

    return vec3(positionLocal.x, height, positionLocal.z)
  })()
  water.colorNode = Fn(() => {
    // Trace the rays in pool space, where the floor and the height field have
    // their fixed positions regardless of where the pool is placed or scaled.
    const surfacePoint = poolSpacePointNode(positionWorld, context)
    const cameraPoint = poolSpacePointNode(cameraPosition, context)
    const incomingRay = normalize(surfacePoint.sub(cameraPoint))
    const normal = waterNormalNode(context.waterTexture, surfacePoint)
    const color = vec3(0).toVar()

    If(frontFacing, () => {
      const reflectedRay = reflect(incomingRay, normal)
      const refractedRay = refract(incomingRay, normal, SURFACE_TO_AIR)
      const cosTheta = clamp(dot(normal, incomingRay.negate()), 0, 1)
      const fresnel = mix(0.08, 1, pow(float(1).sub(cosTheta), 3))
      const reflected = surfaceRayColorNode(surfacePoint, reflectedRay, context)
      const refracted = surfaceRayColorNode(surfacePoint, refractedRay, context)

      color.assign(mix(refracted, reflected, fresnel))
    }).Else(() => {
      const flippedNormal = normal.negate()
      const reflectedRay = reflect(incomingRay, flippedNormal)
      const refractedRay = refract(incomingRay, flippedNormal, AIR_TO_SURFACE)
      const cosTheta = clamp(dot(flippedNormal, incomingRay.negate()), 0, 1)
      const fresnel = mix(0.5, 1, pow(float(1).sub(cosTheta), 3))
      const reflected = surfaceRayColorNode(surfacePoint, reflectedRay, context)
      const refracted = surfaceRayColorNode(
        surfacePoint,
        refractedRay,
        context
      ).mul(underwaterTintColor)

      color.assign(
        mix(reflected, refracted, float(1).sub(fresnel).mul(length(refractedRay)))
      )
    })

    return color
  })()

  const pool = new MeshBasicNodeMaterial()
  pool.name = 'WaterPoolBasin'
  pool.side = THREE.DoubleSide
  pool.colorNode = Fn(() => {
    const basinPoint = poolSpacePointNode(positionWorld, context).toVar()
    const color = basinColorNode(basinPoint, context).toVar()
    const waterHeight = texture(
      context.waterTexture,
      basinPoint.xz.mul(0.5).add(0.5)
    ).r

    If(basinPoint.y.lessThan(waterHeight), () => {
      color.mulAssign(underwaterTintColor.mul(1.1))
    })

    return color
  })()

  const boxes = context.boxes.map((box) => {
    const material = new MeshBasicNodeMaterial()
    material.name = 'WaterPoolBox'
    material.colorNode = Fn(() => {
      const boxPoint = poolSpacePointNode(positionWorld, context).toVar()
      const color = boxColorNode(boxPoint, box, context).toVar()
      const waterHeight = texture(
        context.waterTexture,
        boxPoint.xz.mul(0.5).add(0.5)
      ).r

      If(boxPoint.y.lessThan(waterHeight), () => {
        color.mulAssign(underwaterTintColor.mul(1.1))
      })

      return color
    })()

    return material
  })

  const sky = new MeshBasicNodeMaterial()
  sky.name = 'WaterPoolSky'
  sky.side = THREE.BackSide
  sky.depthWrite = false
  sky.colorNode = Fn(() =>
    waterPoolSkyColorNode(
      normalize(positionWorld.sub(cameraPosition)),
      context.lightDirection
    )
  )()

  return { water, pool, boxes, sky }
}
