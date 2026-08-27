import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FlowLineMesh from '../meshes/FlowLineMesh'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

// Mirrors the private fields the 0.4.0 leak fixes introduced. `arrowTexture` in
// particular used to be unreachable, which is why it was never disposed.
interface FlowLineInternals {
  animationId: number | null
  timeUniform: { value: number }
  lineColorUniform: { value: THREE.Vector4 }
  arrowColorUniform: { value: THREE.Vector3 }
  arrowTexture: THREE.Texture | null
  onAdded: () => void
  speed: number
  startTime: number
}

function internals(mesh: FlowLineMesh): FlowLineInternals {
  return mesh as unknown as FlowLineInternals
}

describe('FlowLineMesh', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
    // jsdom has no canvas backend, so `createArrowTexture` would log a loud
    // "Not implemented" trace on every construction. The source already handles a
    // null 2d context, so return null quietly and keep the test output readable.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('builds a smoothed, indexed geometry from the control points', () => {
    const mesh = new FlowLineMesh()

    // 120 curve segments -> 121 smooth points -> 2 vertices per point.
    expect(mesh.geometry.getAttribute('position').count).toBe(242)
    expect(mesh.geometry.getAttribute('uv').count).toBe(242)
    expect(mesh.geometry.getIndex()).not.toBeNull()

    mesh.dispose()
  })

  it('keeps a handle on the arrow texture so it can be released', () => {
    const mesh = new FlowLineMesh()

    expect(internals(mesh).arrowTexture).toBeInstanceOf(THREE.Texture)

    mesh.dispose()
  })

  it('starts a frame loop from the constructor', () => {
    const mesh = new FlowLineMesh()

    expect(raf.request).toHaveBeenCalledTimes(1)

    mesh.dispose()
  })

  it('drives the time uniform from elapsed wall clock time and speed', () => {
    // Only `Date.now` is mocked here: `vi.useFakeTimers()` would also replace
    // requestAnimationFrame and shadow the fake installed above.
    const now = vi.spyOn(Date, 'now').mockReturnValue(1000)
    const mesh = new FlowLineMesh({ speed: 2 })

    now.mockReturnValue(1500)
    raf.flush()

    // 0.5s elapsed * speed 2
    expect(internals(mesh).timeUniform.value).toBeCloseTo(1)

    mesh.dispose()
  })

  it('releases geometry, material and arrow texture on dispose', () => {
    const mesh = new FlowLineMesh()
    const texture = internals(mesh).arrowTexture as THREE.Texture
    const geometrySpy = vi.spyOn(mesh.geometry, 'dispose')
    const materialSpy = vi.spyOn(mesh.material as THREE.Material, 'dispose')
    const textureSpy = vi.spyOn(texture, 'dispose')

    mesh.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
    expect(textureSpy).toHaveBeenCalledTimes(1)
    expect(internals(mesh).arrowTexture).toBeNull()
  })

  it('stops the frame loop and removes the added listener on dispose', () => {
    const mesh = new FlowLineMesh()
    const { onAdded } = internals(mesh)

    mesh.dispose()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pending.size).toBe(0)
    expect(internals(mesh).animationId).toBeNull()
    expect(mesh.hasEventListener('added', onAdded)).toBe(false)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const mesh = new FlowLineMesh()
    scene.add(mesh)

    mesh.dispose()

    expect(scene.children).not.toContain(mesh)
  })

  it('keeps raw colors when the scene renders through WebGL', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: false }
    const mesh = new FlowLineMesh({ color: [0.5, 0.25, 0.125, 0.5], arrowColor: [0.5, 0.25, 0.125] })

    scene.add(mesh)

    const line = internals(mesh).lineColorUniform.value
    const arrow = internals(mesh).arrowColorUniform.value
    expect([line.x, line.y, line.z, line.w]).toEqual([0.5, 0.25, 0.125, 0.5])
    expect([arrow.x, arrow.y, arrow.z]).toEqual([0.5, 0.25, 0.125])

    mesh.dispose()
  })

  it('pre-corrects line and arrow colors when the scene renders through WebGPU', () => {
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: true }
    const mesh = new FlowLineMesh({ color: [0.5, 0.25, 0.125, 0.5], arrowColor: [0.5, 0.25, 0.125] })

    scene.add(mesh)

    const brightness = 0.86
    const line = internals(mesh).lineColorUniform.value
    const arrow = internals(mesh).arrowColorUniform.value
    expect(line.x).toBeCloseTo(Math.pow(0.5, 2.2) * brightness)
    expect(line.w).toBe(0.5)
    expect(arrow.x).toBeCloseTo(Math.pow(0.5, 2.2) * brightness)
    expect(arrow.z).toBeCloseTo(Math.pow(0.125, 2.2) * brightness)

    mesh.dispose()
  })
})
