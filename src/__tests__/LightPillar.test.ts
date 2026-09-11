import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LightPillar from '../utils/LightPillar'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

// The uniforms, the geometry cache and the `added` listener are private
// implementation details, but they are exactly what the resource cleanup
// contract touches, so the tests read them through a narrow structural cast
// instead of widening the public API.
interface LightPillarInternals {
  animationId: number | null
  bundles: { timeUniform: { value: number }; colorUniform: { value: THREE.Color }; material: THREE.Material }[]
  geometries: THREE.BufferGeometry[]
  onAdded: () => void
}

function internals(pillar: LightPillar): LightPillarInternals {
  return pillar as unknown as LightPillarInternals
}

describe('LightPillar', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds the cones, the glow and the two pulse rings', () => {
    const pillar = new LightPillar()

    // 2 cones + 1 glow + 2 rings
    expect(pillar.children).toHaveLength(5)
    expect(internals(pillar).geometries).toHaveLength(5)

    pillar.dispose()
  })

  it('skips the optional glow and rings when they are disabled', () => {
    const pillar = new LightPillar({ glow: false, ring: false })

    expect(pillar.children).toHaveLength(2)
    // A single shared cone material drives both cones.
    expect(internals(pillar).bundles).toHaveLength(1)

    pillar.dispose()
  })

  it('shares one material between the outer shell and the inner core', () => {
    const pillar = new LightPillar()
    const [outer, inner] = pillar.children as THREE.Mesh[]

    expect(outer.material).toBe(inner.material)

    pillar.dispose()
  })

  it('stands the cones on the ground plane', () => {
    const pillar = new LightPillar({ height: 4 })
    const outer = pillar.children[0] as THREE.Mesh

    outer.geometry.computeBoundingBox()
    const box = outer.geometry.boundingBox!

    expect(box.min.y).toBeCloseTo(0)
    expect(box.max.y).toBeCloseTo(4)

    pillar.dispose()
  })

  it('starts a frame loop from the constructor', () => {
    const pillar = new LightPillar()

    expect(raf.request).toHaveBeenCalledTimes(1)

    pillar.dispose()
  })

  it('advances every time uniform on each frame', () => {
    const pillar = new LightPillar()

    raf.flush()

    internals(pillar).bundles.forEach((bundle) => {
      expect(bundle.timeUniform.value).toBeGreaterThanOrEqual(0)
    })

    pillar.dispose()
  })

  it('stops the frame loop on dispose', () => {
    const pillar = new LightPillar()

    pillar.dispose()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pending.size).toBe(0)
    expect(internals(pillar).animationId).toBeNull()

    const requestCount = raf.request.mock.calls.length
    raf.flush()
    expect(raf.request.mock.calls.length).toBe(requestCount)
  })

  it('removes the added listener on dispose so the pillar can be garbage collected', () => {
    const pillar = new LightPillar()
    const { onAdded } = internals(pillar)
    expect(pillar.hasEventListener('added', onAdded)).toBe(true)

    pillar.dispose()

    expect(pillar.hasEventListener('added', onAdded)).toBe(false)
  })

  it('releases every geometry and material on dispose', () => {
    const pillar = new LightPillar()
    const geometrySpies = internals(pillar).geometries.map((geometry) => vi.spyOn(geometry, 'dispose'))
    const materialSpies = internals(pillar).bundles.map((bundle) => vi.spyOn(bundle.material, 'dispose'))

    pillar.dispose()

    geometrySpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    materialSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    expect(pillar.children).toHaveLength(0)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const pillar = new LightPillar()
    scene.add(pillar)

    pillar.dispose()

    expect(scene.children).not.toContain(pillar)
  })

  it('is safe to dispose twice', () => {
    const pillar = new LightPillar()

    pillar.dispose()
    expect(() => pillar.dispose()).not.toThrow()
    expect(raf.cancel).toHaveBeenCalledTimes(1)
  })

  it('keeps raw colors when the scene renders through WebGL', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: false }
    const pillar = new LightPillar({ color: 0x336699 })

    scene.add(pillar)

    const expected = new THREE.Color(0x336699)
    internals(pillar).bundles.forEach((bundle) => {
      expect(bundle.colorUniform.value.getHex()).toBe(expected.getHex())
    })

    pillar.dispose()
  })

  it('pre-corrects colors when the scene renders through WebGPU', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: true }
    const pillar = new LightPillar({ color: 0x336699 })

    scene.add(pillar)

    const brightness = 0.86
    const { r, g, b } = new THREE.Color(0x336699)
    internals(pillar).bundles.forEach((bundle) => {
      expect(bundle.colorUniform.value.r).toBeCloseTo(Math.pow(r, 2.2) * brightness)
      expect(bundle.colorUniform.value.g).toBeCloseTo(Math.pow(g, 2.2) * brightness)
      expect(bundle.colorUniform.value.b).toBeCloseTo(Math.pow(b, 2.2) * brightness)
    })

    pillar.dispose()
  })

  it('leaves colors untouched while the renderer is still unknown', () => {
    const scene = new THREE.Scene()
    const pillar = new LightPillar({ color: 0x336699 })

    scene.add(pillar)

    expect(internals(pillar).bundles[0].colorUniform.value.getHex()).toBe(new THREE.Color(0x336699).getHex())

    pillar.dispose()
  })
})
