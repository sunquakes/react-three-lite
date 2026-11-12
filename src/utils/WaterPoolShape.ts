import * as THREE from 'three'

/**
 * Convex outline shared by the water pool geometry and its shaders.
 *
 * The container is described by a convex polygon in the XZ plane, given
 * counter-clockwise. Every edge is stored as an inward half-plane, which keeps
 * both the CPU clamping and the fragment shader ray intersection exact and
 * cheap.
 */
export type WaterPoolOutline = ReadonlyArray<readonly [number, number]>

/**
 * Built-in container shapes. Pass an outline or a `THREE.BufferGeometry` (for
 * example a `ConvexGeometry`) for a custom pool; geometry vertices are
 * projected onto the XZ plane and reduced to their convex hull.
 */
export type WaterPoolShape = 'box' | WaterPoolOutline | THREE.BufferGeometry

/** Default square outline: `x` and `z` from -1 to 1, counter-clockwise. */
export const WATER_POOL_BOX_OUTLINE: WaterPoolOutline = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1]
]

/**
 * Irregular cube outline used by the `WaterPool` component by default: a skewed
 * quadrilateral with four sides of different lengths and no right angles, so
 * the water reads as a slightly distorted block instead of a square. It stays
 * centred on the origin and inside -1…1 like the box outline.
 */
export const WATER_POOL_IRREGULAR_CUBE_OUTLINE: WaterPoolOutline = [
  [-0.95, -0.55],
  [0.85, -0.92],
  [0.68, 0.9],
  [-0.9, 0.62]
]

export interface WaterPoolEdge {
  /** X component of the inward facing edge normal. */
  nx: number
  /** Z component of the inward facing edge normal. */
  nz: number
  /** A point lies inside the half-plane when `nx * x + nz * z >= offset`. */
  offset: number
}

/**
 * Reduces a point set to its convex outline in the XZ plane, ordered
 * counter-clockwise, using the monotone chain algorithm. Collinear points are
 * dropped so every edge of the result bounds the polygon.
 */
export function convexHull2D(
  points: ReadonlyArray<readonly [number, number]>
): WaterPoolOutline {
  const sorted = points
    .map(([x, z]) => [x, z] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])

  if (sorted.length < 3) {
    return sorted
  }

  const cross = (
    origin: readonly [number, number],
    a: readonly [number, number],
    b: readonly [number, number]
  ) => (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])

  const lower: Array<[number, number]> = []
  for (const point of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop()
    }
    lower.push(point)
  }

  const upper: Array<[number, number]> = []
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop()
    }
    upper.push(point)
  }

  lower.pop()
  upper.pop()

  return [...lower, ...upper]
}

/** Vertices of a geometry projected onto the XZ plane. */
function geometryOutlinePoints(
  geometry: THREE.BufferGeometry
): Array<[number, number]> {
  const position = geometry.getAttribute('position')
  if (!position) {
    throw new Error('WaterPool shape geometry needs a position attribute')
  }

  const points: Array<[number, number]> = []
  for (let index = 0; index < position.count; index += 1) {
    points.push([position.getX(index), position.getZ(index)])
  }

  return points
}

/**
 * Resolves the `shape` prop to the convex outline used by the pool. Outlines
 * and geometry vertices are reduced to their convex hull, so a `ConvexGeometry`
 * built from scattered points works as well as an explicit polygon.
 */
export function resolveWaterPoolShape(
  shape: WaterPoolShape = 'box'
): WaterPoolOutline {
  if (shape === 'box') {
    return WATER_POOL_BOX_OUTLINE
  }

  const outline = convexHull2D(
    shape instanceof THREE.BufferGeometry ? geometryOutlinePoints(shape) : shape
  )

  if (outline.length < 3) {
    throw new Error('WaterPool shape needs at least three non-collinear [x, z] points')
  }

  // The surface is built from rings scaled towards the origin and every ray
  // starts inside the pool, so the outline has to contain [0, 0].
  if (!isInsideWaterPool(createWaterPoolEdges(outline), 0, 0)) {
    throw new Error('WaterPool shape must contain the origin [0, 0]')
  }

  return outline
}

/** Inward half-planes of a counter-clockwise convex outline. */
export function createWaterPoolEdges(
  outline: WaterPoolOutline
): WaterPoolEdge[] {
  return outline.map((start, index) => {
    const end = outline[(index + 1) % outline.length]
    const edgeX = end[0] - start[0]
    const edgeZ = end[1] - start[1]
    const length = Math.hypot(edgeX, edgeZ)
    const nx = -edgeZ / length
    const nz = edgeX / length

    return { nx, nz, offset: nx * start[0] + nz * start[1] }
  })
}

/** Axis aligned bounds of the outline, used to sample random ripple points. */
export function getWaterPoolBounds(outline: WaterPoolOutline): {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity

  outline.forEach(([x, z]) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  })

  return { minX, maxX, minZ, maxZ }
}

/** True when the point lies inside the pool, inset by `margin`. */
export function isInsideWaterPool(
  edges: readonly WaterPoolEdge[],
  x: number,
  z: number,
  margin = 0
): boolean {
  return edges.every(
    (edge) => edge.nx * x + edge.nz * z >= edge.offset + margin
  )
}

/**
 * Pushes a point back inside the outline, keeping at least `margin` distance
 * from every wall. The repeat passes let a corner adjustment refine the
 * opposite edges, which converges quickly for a convex outline.
 */
export function clampToWaterPool(
  edges: readonly WaterPoolEdge[],
  x: number,
  z: number,
  margin = 0
): [number, number] {
  let clampedX = x
  let clampedZ = z

  for (let pass = 0; pass < 3; pass += 1) {
    edges.forEach((edge) => {
      const distance = edge.nx * clampedX + edge.nz * clampedZ - edge.offset
      if (distance < margin) {
        const push = margin - distance
        clampedX += edge.nx * push
        clampedZ += edge.nz * push
      }
    })
  }

  return [clampedX, clampedZ]
}

/**
 * Samples the outline as a closed ring of XZ points, with `segmentsPerEdge`
 * subdivisions on every edge so the rendered boundary matches the half-planes
 * used by the shader exactly.
 */
export function sampleWaterPoolOutline(
  outline: WaterPoolOutline,
  segmentsPerEdge: number
): Array<[number, number]> {
  const steps = Math.max(1, Math.round(segmentsPerEdge))
  const points: Array<[number, number]> = []

  outline.forEach((start, index) => {
    const end = outline[(index + 1) % outline.length]
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps
      points.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t
      ])
    }
  })

  return points
}
