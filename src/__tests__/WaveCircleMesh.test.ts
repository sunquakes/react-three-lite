import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import WaveCircleMesh from '../meshes/WaveCircleMesh'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

// The uniforms and the `added` listener are private implementation details, but
// they are exactly what the 0.4.0 leak fixes touch, so the tests read them
// through a narrow structural cast instead of widening the public API.
interface WaveCircleInternals {
  animationId: number | null
  timeUniform: { value: number }
  colorUniform: { value: THREE.Vector4 }
  onAdded: () => void
}

function internals(mesh: WaveCircleMesh): WaveCircleInternals {
  return mesh as unknown as WaveCircleInternals
}

describe('WaveCircleMesh', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts a frame loop from the constructor', () => {
    const mesh = new WaveCircleMesh()

    expect(mesh.isMesh).toBe(true)
    expect(raf.request).toHaveBeenCalledTimes(1)

    mesh.dispose()
  })

  it('advances the time uniform on every frame', () => {
    const mesh = new WaveCircleMesh({ speed: 2 })
    const before = internals(mesh).timeUniform.value

    raf.flush()

    expect(internals(mesh).timeUniform.value).toBeCloseTo(before + 0.005 * 2)

    mesh.dispose()
  })

  it('stops the frame loop on dispose', () => {
    const mesh = new WaveCircleMesh()

    mesh.dispose()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pending.size).toBe(0)
    expect(internals(mesh).animationId).toBeNull()

    // A cancelled loop must not schedule any further frames.
    const requestCount = raf.request.mock.calls.length
    raf.flush()
    expect(raf.request.mock.calls.length).toBe(requestCount)
  })

  it('removes the added listener on dispose so the mesh can be garbage collected', () => {
    const mesh = new WaveCircleMesh()
    const { onAdded } = internals(mesh)
    expect(mesh.hasEventListener('added', onAdded)).toBe(true)

    mesh.dispose()

    expect(mesh.hasEventListener('added', onAdded)).toBe(false)
  })

  it('releases geometry and material on dispose', () => {
    const mesh = new WaveCircleMesh()
    const geometrySpy = vi.spyOn(mesh.geometry, 'dispose')
    const materialSpy = vi.spyOn(mesh.material as THREE.Material, 'dispose')

    mesh.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const mesh = new WaveCircleMesh()
    scene.add(mesh)

    mesh.dispose()

    expect(scene.children).not.toContain(mesh)
  })

  it('keeps raw colors when the scene renders through WebGL', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: false }
    const mesh = new WaveCircleMesh({ color: [0.5, 0.25, 0.125, 1] })

    scene.add(mesh)

    const { x, y, z, w } = internals(mesh).colorUniform.value
    expect([x, y, z, w]).toEqual([0.5, 0.25, 0.125, 1])

    mesh.dispose()
  })

  it('pre-corrects colors when the scene renders through WebGPU', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: true }
    const mesh = new WaveCircleMesh({ color: [0.5, 0.25, 0.125, 1] })

    scene.add(mesh)

    const brightness = 0.86
    const { x, y, z, w } = internals(mesh).colorUniform.value
    expect(x).toBeCloseTo(Math.pow(0.5, 2.2) * brightness)
    expect(y).toBeCloseTo(Math.pow(0.25, 2.2) * brightness)
    expect(z).toBeCloseTo(Math.pow(0.125, 2.2) * brightness)
    expect(w).toBe(1)

    mesh.dispose()
  })

  it('leaves colors untouched while the renderer is still unknown', () => {
    const scene = new THREE.Scene()
    const mesh = new WaveCircleMesh({ color: [0.5, 0.25, 0.125, 1] })

    scene.add(mesh)

    expect(internals(mesh).colorUniform.value.x).toBe(0.5)

    mesh.dispose()
  })
})
