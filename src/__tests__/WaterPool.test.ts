import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { describe, expect, it } from 'vitest'
import { WaterPoolSimulation } from '../utils/WaterPoolSimulation'
import { createWaterPoolMaterials } from '../utils/WaterPoolMaterials'
import {
  WATER_POOL_BOX_OUTLINE,
  clampToWaterPool,
  convexHull2D,
  createWaterPoolEdges,
  getWaterPoolBounds,
  isInsideWaterPool,
  resolveWaterPoolShape,
  sampleWaterPoolOutline,
  WATER_POOL_IRREGULAR_CUBE_OUTLINE
} from '../utils/WaterPoolShape'

const createSimulation = () => new WaterPoolSimulation({ resolution: 32 })

describe('WaterPoolSimulation', () => {
  it('starts from a flat surface', () => {
    const simulation = createSimulation()

    expect(simulation.heights.every((value) => value === 0)).toBe(true)
    expect(simulation.velocities.every((value) => value === 0)).toBe(true)
    expect(simulation.normalX.every((value) => value === 0)).toBe(true)
    expect(simulation.normalZ.every((value) => value === 0)).toBe(true)
  })

  it('raises the surface around a drop and propagates it to neighbours', () => {
    const simulation = createSimulation()

    simulation.addDrop(0, 0, 0.1, 0.02)
    expect(simulation.getHeightAt(0, 0)).toBeGreaterThan(0)
    expect(simulation.getHeightAt(0.9, 0.9)).toBe(0)

    simulation.step(2)
    simulation.updateNormals()

    expect(simulation.getHeightAt(0, 0)).not.toBe(0)
    const nearCentre = simulation.getHeightAt(0.15, 0)
    expect(Number.isFinite(nearCentre)).toBe(true)
    expect(Math.abs(nearCentre)).toBeGreaterThan(0)
  })

  it('keeps the height field finite and bounded while stepping', () => {
    const simulation = createSimulation()
    simulation.addDrop(0.2, -0.4, 0.08, 0.02)

    for (let frame = 0; frame < 120; frame += 1) {
      simulation.step(2)
    }
    simulation.updateNormals()

    expect(simulation.heights.every(Number.isFinite)).toBe(true)
    expect(simulation.velocities.every(Number.isFinite)).toBe(true)
    expect(simulation.normalX.every(Number.isFinite)).toBe(true)
    expect(simulation.normalZ.every(Number.isFinite)).toBe(true)

    const maxHeight = Math.max(...simulation.heights)
    expect(maxHeight).toBeLessThan(0.5)
  })

  it('builds unit length normals from the height field', () => {
    const simulation = createSimulation()
    simulation.addDrop(0.1, 0.1, 0.12, 0.03)
    simulation.updateNormals()

    let tilted = 0
    for (let index = 0; index < simulation.heights.length; index += 1) {
      const nx = simulation.normalX[index]
      const nz = simulation.normalZ[index]
      expect(Number.isFinite(nx)).toBe(true)
      expect(Number.isFinite(nz)).toBe(true)
      expect(nx * nx + nz * nz).toBeLessThanOrEqual(1.000001)
      if (Math.abs(nx) + Math.abs(nz) > 1e-4) {
        tilted += 1
      }
    }
    expect(tilted).toBeGreaterThan(0)
  })

  it('packs the water state into half float RGBA texels', () => {
    const simulation = createSimulation()
    simulation.addDrop(0.3, 0.3, 0.1, 0.02)
    simulation.step(2)
    simulation.updateNormals()
    simulation.syncWaterTexture()

    const data = simulation.waterTextureData
    expect(data.length).toBe(simulation.resolution * simulation.resolution * 4)

    const halfFloat = THREE.DataUtils.fromHalfFloat(data[0])
    expect(halfFloat).toBeCloseTo(simulation.heights[0], 3)

    // Every texel must decode to a finite value.
    for (let index = 0; index < data.length; index += 1) {
      expect(Number.isFinite(THREE.DataUtils.fromHalfFloat(data[index]))).toBe(true)
    }
  })
})

describe('WaterPoolShape', () => {
  const boxOutline = resolveWaterPoolShape()
  const boxEdges = createWaterPoolEdges(boxOutline)

  it('resolves the default shape to the unit box outline', () => {
    expect(boxOutline).toEqual(WATER_POOL_BOX_OUTLINE)
    expect(getWaterPoolBounds(boxOutline)).toEqual({
      minX: -1,
      maxX: 1,
      minZ: -1,
      maxZ: 1
    })
  })

  it('keeps the irregular cube outline inside the unit square', () => {
    const outline = resolveWaterPoolShape(WATER_POOL_IRREGULAR_CUBE_OUTLINE)
    const edges = createWaterPoolEdges(outline)
    const bounds = getWaterPoolBounds(outline)

    expect(outline).toHaveLength(4)
    expect(bounds.minX).toBeGreaterThanOrEqual(-1)
    expect(bounds.maxX).toBeLessThanOrEqual(1)
    expect(bounds.minZ).toBeGreaterThanOrEqual(-1)
    expect(bounds.maxZ).toBeLessThanOrEqual(1)
    expect(isInsideWaterPool(edges, 0, 0)).toBe(true)

    const sideLengths = outline.map(([x, z], index) => {
      const [nextX, nextZ] = outline[(index + 1) % outline.length]
      return Math.hypot(nextX - x, nextZ - z)
    })
    expect(new Set(sideLengths.map((side) => side.toFixed(3))).size).toBe(4)
  })

  it('rejects custom outlines with fewer than three points', () => {
    expect(() => resolveWaterPoolShape([[0, 0], [1, 1]])).toThrow()
  })

  it('rejects custom outlines that miss the origin', () => {
    expect(() =>
      resolveWaterPoolShape([[0.2, 0.2], [1, 0.2], [1, 1], [0.2, 1]])
    ).toThrow()
  })

  it('tells inside points from points outside the basin', () => {
    expect(isInsideWaterPool(boxEdges, 0, 0)).toBe(true)
    expect(isInsideWaterPool(boxEdges, 0.99, -0.5)).toBe(true)
    expect(isInsideWaterPool(boxEdges, 1.05, 0)).toBe(false)
    expect(isInsideWaterPool(boxEdges, 0, -1.05)).toBe(false)
  })

  it('pushes dragged boxes back inside the outline', () => {
    const [x, z] = clampToWaterPool(boxEdges, 1.4, -1.2, 0.1)

    expect(isInsideWaterPool(boxEdges, x, z, 0.099)).toBe(true)
  })

  it('samples the outline as a closed ring on the boundary', () => {
    const points = sampleWaterPoolOutline(boxOutline, 3)

    expect(points).toHaveLength(boxOutline.length * 3)
    points.forEach(([x, z]) => {
      expect(isInsideWaterPool(boxEdges, x, z, -1e-4)).toBe(true)
    })
  })

  it('accepts a custom convex outline', () => {
    const outline = resolveWaterPoolShape([
      [-1, -0.5],
      [1, -0.5],
      [1, 0.5],
      [-1, 0.5]
    ])
    const edges = createWaterPoolEdges(outline)

    expect(isInsideWaterPool(edges, 0, 0)).toBe(true)
    expect(isInsideWaterPool(edges, 0, 0.9)).toBe(false)
    expect(getWaterPoolBounds(outline).maxZ).toBe(0.5)
  })

  it('reduces points and collinear vertices to the convex outline', () => {
    const outline = convexHull2D([
      [1, 1],
      [-1, 1],
      [-1, -1],
      [1, -1],
      [0, 0],
      [0, 1]
    ])

    expect(outline).toEqual([...WATER_POOL_BOX_OUTLINE])
    expect(resolveWaterPoolShape([[0.5, -0.5], [-0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]])).toHaveLength(4)
  })

  it('reduces a non-convex point ring to a convex hull of the origin', () => {
    // A four pointed star: the hull keeps only its tips.
    const outline = resolveWaterPoolShape([
      [1, 0],
      [0.2, 0.2],
      [0, 1],
      [-0.2, 0.2],
      [-1, 0],
      [-0.2, -0.2],
      [0, -1],
      [0.2, -0.2]
    ])

    expect(outline).toHaveLength(4)
    expect(isInsideWaterPool(createWaterPoolEdges(outline), 0, 0)).toBe(true)
  })

  it('derives the outline from a geometry projected onto XZ', () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          -1, 0, -0.5,
          1, 0.2, -0.5,
          1, -0.2, 0.5,
          -1, 0, 0.5,
          0, 0.1, 0,
          0, -0.1, 0.2
        ],
        3
      )
    )

    const outline = resolveWaterPoolShape(geometry)
    const edges = createWaterPoolEdges(outline)

    expect(outline).toHaveLength(4)
    expect(getWaterPoolBounds(outline)).toEqual({
      minX: -1,
      maxX: 1,
      minZ: -0.5,
      maxZ: 0.5
    })
    expect(isInsideWaterPool(edges, 0, 0)).toBe(true)

    geometry.dispose()
  })

  it('rejects a geometry without a position attribute', () => {
    const geometry = new THREE.BufferGeometry()

    expect(() => resolveWaterPoolShape(geometry)).toThrow()
    geometry.dispose()
  })
})

describe('WaterPoolMaterials', () => {
  const createMaterials = () => {
    const waterTexture = new THREE.DataTexture(
      new Uint16Array(4 * 4 * 4),
      4,
      4,
      THREE.RGBAFormat,
      THREE.HalfFloatType
    )
    const materials = createWaterPoolMaterials({
      waterTexture,
      lightDirection: uniform(new THREE.Vector3(0.55, 0.9, 0.35).normalize()),
      poolCenter: uniform(new THREE.Vector3(1, 0.5, -2)),
      poolScale: uniform(2)
    })

    const dispose = () => {
      materials.water.dispose()
      waterTexture.dispose()
    }

    return { materials, dispose }
  }

  it('builds the node material for the water surface', () => {
    const { materials, dispose } = createMaterials()

    expect(materials.water.name).toBe('WaterPoolSurface')
    expect(materials.water.positionNode).toBeDefined()
    expect(materials.water.colorNode).toBeDefined()
    expect(materials.water.side).toBe(THREE.DoubleSide)

    dispose()
  })
})
