import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Fireworks from '../utils/Fireworks'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

// The uniforms, the node material and the `added` listener are private
// implementation details, but they are exactly what the resource cleanup
// contract touches, so the tests read them through a narrow structural cast
// instead of widening the public API.
interface FireworksInternals {
  animationId: number | null
  uniforms: {
    uTime: { value: number }
    uLaunchDuration: { value: number }
    uDelayDuration: { value: number }
    uBurstDuration: { value: number }
    uColor: { value: THREE.Color }
  }
  nodeMaterial: THREE.Material
  onAdded: () => void
}

function internals(fireworks: Fireworks): FireworksInternals {
  return fireworks as unknown as FireworksInternals
}

function cycleDuration(fireworks: Fireworks): number {
  const { uLaunchDuration, uDelayDuration, uBurstDuration } = internals(fireworks).uniforms
  return uLaunchDuration.value + uDelayDuration.value + uBurstDuration.value
}

describe('Fireworks', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is a single mesh carrying the trail geometry', () => {
    const fireworks = new Fireworks()

    expect(fireworks).toBeInstanceOf(THREE.Mesh)
    expect(fireworks.geometry.getAttribute('position')).toBeDefined()
    expect(fireworks.geometry.getAttribute('tangent')).toBeDefined()
    expect(fireworks.geometry.getAttribute('uv')).toBeDefined()
    expect(fireworks.geometry.getAttribute('isBurstTrail')).toBeDefined()

    fireworks.dispose()
  })

  it('starts a frame loop from the constructor', () => {
    const fireworks = new Fireworks()

    expect(raf.request).toHaveBeenCalledTimes(1)

    fireworks.dispose()
  })

  it('advances the time uniform on update', () => {
    const fireworks = new Fireworks()

    fireworks.update(0.5)

    expect(internals(fireworks).uniforms.uTime.value).toBeCloseTo(0.5)

    fireworks.dispose()
  })

  it('resets the time to 0 when a cycle finishes and loop is on', () => {
    const fireworks = new Fireworks()
    const duration = cycleDuration(fireworks)

    fireworks.update(duration + 0.5)
    fireworks.update(0.1)

    expect(internals(fireworks).uniforms.uTime.value).toBe(0)

    fireworks.dispose()
  })

  it('keeps accumulating time when loop is off', () => {
    const fireworks = new Fireworks({ loop: false })
    const duration = cycleDuration(fireworks)

    fireworks.update(duration + 0.5)
    fireworks.update(0.1)

    expect(internals(fireworks).uniforms.uTime.value).toBeCloseTo(duration + 0.6)

    fireworks.dispose()
  })

  it('restarts the current time', () => {
    const fireworks = new Fireworks()

    fireworks.update(1)
    fireworks.restart()

    expect(internals(fireworks).uniforms.uTime.value).toBe(0)

    fireworks.dispose()
  })

  it('stops the frame loop on dispose', () => {
    const fireworks = new Fireworks()

    fireworks.dispose()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pending.size).toBe(0)
    expect(internals(fireworks).animationId).toBeNull()

    const requestCount = raf.request.mock.calls.length
    raf.flush()
    expect(raf.request.mock.calls.length).toBe(requestCount)
  })

  it('removes the added listener on dispose so the mesh can be garbage collected', () => {
    const fireworks = new Fireworks()
    const { onAdded } = internals(fireworks)
    expect(fireworks.hasEventListener('added', onAdded)).toBe(true)

    fireworks.dispose()

    expect(fireworks.hasEventListener('added', onAdded)).toBe(false)
  })

  it('releases the geometry and material on dispose', () => {
    const fireworks = new Fireworks()
    const geometrySpy = vi.spyOn(fireworks.geometry, 'dispose')
    const materialSpy = vi.spyOn(internals(fireworks).nodeMaterial, 'dispose')

    fireworks.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const fireworks = new Fireworks()
    scene.add(fireworks)

    fireworks.dispose()

    expect(scene.children).not.toContain(fireworks)
  })

  it('is safe to dispose twice', () => {
    const fireworks = new Fireworks()

    fireworks.dispose()
    expect(() => fireworks.dispose()).not.toThrow()
    expect(raf.cancel).toHaveBeenCalledTimes(1)
  })

  it('keeps raw colors when the scene renders through WebGL', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: false }
    const fireworks = new Fireworks({ color: 0x336699 })

    scene.add(fireworks)

    expect(internals(fireworks).uniforms.uColor.value.getHex()).toBe(
      new THREE.Color(0x336699).getHex()
    )

    fireworks.dispose()
  })

  it('pre-corrects colors when the scene renders through WebGPU', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: true }
    const fireworks = new Fireworks({ color: 0x336699 })

    scene.add(fireworks)

    const brightness = 0.86
    const { r, g, b } = new THREE.Color(0x336699)
    const color = internals(fireworks).uniforms.uColor.value
    expect(color.r).toBeCloseTo(Math.pow(r, 2.2) * brightness)
    expect(color.g).toBeCloseTo(Math.pow(g, 2.2) * brightness)
    expect(color.b).toBeCloseTo(Math.pow(b, 2.2) * brightness)

    fireworks.dispose()
  })
})
