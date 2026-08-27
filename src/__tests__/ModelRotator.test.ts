import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ModelRotator from '../utils/ModelRotator'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

interface ModelRotatorInternals {
  axis: 'x' | 'y' | 'z'
  speed: number
  isRotating: boolean
  lastTime: number
  animationId: number | null
}

function internals(rotator: ModelRotator): ModelRotatorInternals {
  return rotator as unknown as ModelRotatorInternals
}

describe('ModelRotator', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('spins around y at 0.5 rad/s by default', () => {
    const rotator = new ModelRotator(new THREE.Object3D())

    const state = internals(rotator)
    expect(state.axis).toBe('y')
    expect(state.speed).toBe(0.5)
    expect(state.isRotating).toBe(true)

    rotator.dispose()
  })

  it('starts rotating immediately unless autoStart is disabled', () => {
    const auto = new ModelRotator(new THREE.Object3D())
    expect(raf.request).toHaveBeenCalledTimes(1)
    auto.dispose()

    raf.request.mockClear()

    const manual = new ModelRotator(new THREE.Object3D(), { autoStart: false })
    expect(raf.request).not.toHaveBeenCalled()
    expect(internals(manual).isRotating).toBe(false)
    manual.dispose()
  })

  it('rotates by speed * elapsed seconds on the configured axis', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { axis: 'x', speed: 2 })

    // First frame only samples the clock relative to `lastTime` (0 here).
    raf.flush(1000)

    expect(target.rotation.x).toBeCloseTo(2)
    expect(target.rotation.y).toBe(0)
    expect(target.rotation.z).toBe(0)

    rotator.dispose()
  })

  it('accumulates rotation across frames', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { speed: 1 })

    raf.flush(500)
    raf.flush(1500)

    expect(target.rotation.y).toBeCloseTo(1.5)

    rotator.dispose()
  })

  it('keeps the frame loop alive but frozen while paused', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { speed: 1 })

    raf.flush(1000)
    const rotationWhenPaused = target.rotation.y
    rotator.pause()

    raf.flush(2000)
    raf.flush(3000)

    expect(target.rotation.y).toBe(rotationWhenPaused)
    // The loop is still scheduled, so resuming does not need a new request.
    expect(raf.pending.size).toBe(1)

    rotator.dispose()
  })

  it('resumes from the current clock so the pause does not cause a jump', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { speed: 1 })

    raf.flush(1000)
    rotator.pause()
    // A long pause would produce a huge delta if `lastTime` were not reset.
    vi.spyOn(performance, 'now').mockReturnValue(60000)
    rotator.play()

    raf.flush(60100)

    expect(target.rotation.y).toBeCloseTo(1 + 0.1)

    rotator.dispose()
  })

  it('ignores play while already rotating', () => {
    const rotator = new ModelRotator(new THREE.Object3D())

    rotator.play()
    rotator.play()

    expect(raf.request).toHaveBeenCalledTimes(1)

    rotator.dispose()
  })

  it('resets the rotation and cancels the loop on stop', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target)
    raf.flush(1000)

    rotator.stop()

    expect(target.rotation.x).toBe(0)
    expect(target.rotation.y).toBe(0)
    expect(target.rotation.z).toBe(0)
    expect(internals(rotator).isRotating).toBe(false)
    expect(internals(rotator).animationId).toBeNull()
    expect(raf.pending.size).toBe(0)
  })

  it('applies a new speed to subsequent frames', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { speed: 1 })

    raf.flush(1000)
    rotator.setSpeed(4)
    raf.flush(2000)

    expect(target.rotation.y).toBeCloseTo(1 + 4)

    rotator.dispose()
  })

  it('switches axis without losing the rotation already applied', () => {
    const target = new THREE.Object3D()
    const rotator = new ModelRotator(target, { speed: 1 })

    raf.flush(1000)
    rotator.setAxis('z')
    raf.flush(2000)

    expect(target.rotation.y).toBeCloseTo(1)
    expect(target.rotation.z).toBeCloseTo(1)

    rotator.dispose()
  })

  it('stops the loop on dispose', () => {
    const rotator = new ModelRotator(new THREE.Object3D())

    rotator.dispose()

    expect(raf.cancel).toHaveBeenCalledTimes(1)
    expect(raf.pending.size).toBe(0)
  })
})
