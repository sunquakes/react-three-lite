import * as THREE from 'three'
import { sampleWaterPoolOutline, type WaterPoolOutline } from './WaterPoolShape'

/**
 * Subdivisions along each outline edge. `segments` is the total budget, so an
 * outline with more edges still gets a similar number of boundary vertices.
 */
export function getWaterOutlineSubdivisions(segments: number, outline: WaterPoolOutline): number {
  return Math.max(1, Math.round(segments / outline.length))
}

/**
 * Water surface geometry that follows an outline: concentric rings scaling the
 * outline towards the origin, so the rendered edge matches the outline exactly.
 * Vertices lie on the XZ plane, in the units of the outline.
 */
export function createWaterSurfaceGeometry(
  segments: number,
  outline: WaterPoolOutline
): THREE.BufferGeometry {
  const outlinePoints = sampleWaterPoolOutline(
    outline,
    getWaterOutlineSubdivisions(segments, outline)
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
      // like the flat plane it replaced.
      indices.push(inner + index, inner + next, outer + next)
      indices.push(inner + index, outer + next, outer + index)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)

  return geometry
}
