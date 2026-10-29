import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import SkyDome from '../utils/SkyDome'

describe('SkyDome', () => {
  it('wraps the camera in a sphere of the requested radius', () => {
    const sky = new SkyDome({ radius: 120 })
    const geometry = sky.geometry as THREE.SphereGeometry

    geometry.computeBoundingSphere()
    expect(geometry.boundingSphere!.radius).toBeCloseTo(120)

    sky.dispose()
  })

  it('renders the inside of the dome without writing depth', () => {
    const sky = new SkyDome()
    const material = sky.material

    expect(material.side).toBe(THREE.BackSide)
    expect(material.depthWrite).toBe(false)
    expect(material.fog).toBe(false)

    sky.dispose()
  })

  it('paints both nodes of the shader', () => {
    const sky = new SkyDome()

    expect(sky.material.vertexNode).toBeTruthy()
    expect(sky.material.fragmentNode).toBeTruthy()

    sky.dispose()
  })

  it('draws first and never gets frustum culled', () => {
    const sky = new SkyDome()

    expect(sky.renderOrder).toBe(-1000)
    expect(sky.frustumCulled).toBe(false)

    sky.dispose()
  })

  it('respects the requested segment count', () => {
    const sky = new SkyDome({ segments: 12 })
    const geometry = sky.geometry as THREE.SphereGeometry

    // Width segments are what was asked for, so custom detail is respected.
    expect(geometry.parameters.widthSegments).toBe(12)

    sky.dispose()
  })

  it('releases the geometry and the material on dispose', () => {
    const sky = new SkyDome()
    const geometrySpy = vi.spyOn(sky.geometry, 'dispose')
    const materialSpy = vi.spyOn(sky.material, 'dispose')

    sky.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const sky = new SkyDome()
    scene.add(sky)

    sky.dispose()

    expect(scene.children).not.toContain(sky)
  })

  it('is safe to dispose twice', () => {
    const sky = new SkyDome()
    const geometrySpy = vi.spyOn(sky.geometry, 'dispose')

    sky.dispose()
    expect(() => sky.dispose()).not.toThrow()
    expect(geometrySpy).toHaveBeenCalledTimes(1)
  })
})
