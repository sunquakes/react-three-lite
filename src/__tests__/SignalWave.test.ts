import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SignalWave from '../utils/SignalWave'

// The uniforms are private implementation details, but they are the only place
// the public setters write to, so the tests read them through a narrow cast.
interface SignalWaveInternals {
  directionUniform: { value: THREE.Vector2 }
}

function internals(wave: SignalWave): SignalWaveInternals {
  return wave as unknown as SignalWaveInternals
}

describe('SignalWave', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses a fixed 2x2 quad so the arc math stays in the -1..1 range', () => {
    const wave = new SignalWave()

    wave.geometry.computeBoundingBox()
    const box = wave.geometry.boundingBox!

    expect(box.min.x).toBeCloseTo(-1)
    expect(box.max.x).toBeCloseTo(1)
    expect(box.min.y).toBeCloseTo(-1)
    expect(box.max.y).toBeCloseTo(1)

    wave.dispose()
  })

  it('starts dead and exposes life', () => {
    const wave = new SignalWave()

    expect(wave.life).toBe(0)

    wave.life = 0.35
    expect(wave.life).toBeCloseTo(0.35)

    wave.dispose()
  })

  it('honours the initial life option', () => {
    const wave = new SignalWave({ life: 0.6 })

    expect(wave.life).toBeCloseTo(0.6)

    wave.dispose()
  })

  it('aims the arc with setDirection', () => {
    const wave = new SignalWave()

    wave.setDirection(0.25, -0.75)

    const { value } = internals(wave).directionUniform
    expect(value.x).toBeCloseTo(0.25)
    expect(value.y).toBeCloseTo(-0.75)

    wave.dispose()
  })

  it('honours the initial direction option', () => {
    const wave = new SignalWave({ direction: [0.5, 0.5] })

    const { value } = internals(wave).directionUniform
    expect(value.x).toBeCloseTo(0.5)
    expect(value.y).toBeCloseTo(0.5)

    wave.dispose()
  })

  it('animates itself when travel is given', () => {
    // The wave runs on its own monotonic clock, so pin it to drive the cycle.
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const wave = new SignalWave({ bearing: [0, 1, 0], travel: 10, period: 2, phase: 0.25 })
    const scene = new THREE.Scene()
    scene.add(wave)

    const camera = new THREE.PerspectiveCamera()
    camera.rotation.set(0.3, 0.4, 0.5)
    camera.updateMatrixWorld()

    // Half a second in, a quarter of the two-second cycle has run.
    clock.mockReturnValue(1500)

    // Invoke the automatic per-render hook the way the renderers do.
    wave.onBeforeRender(
      {} as THREE.WebGLRenderer,
      scene,
      camera,
      wave.geometry,
      wave.material,
      new THREE.Group()
    )

    const life = 0.5

    expect(wave.life).toBeCloseTo(life)
    expect(wave.position.x).toBeCloseTo(0)
    expect(wave.position.y).toBeCloseTo(life * 10)
    expect(wave.position.z).toBeCloseTo(0)
    expect(wave.scale.x).toBeCloseTo(THREE.MathUtils.lerp(0.45, 3.4, life))
    expect(wave.quaternion.x).toBeCloseTo(camera.quaternion.x)
    expect(wave.quaternion.w).toBeCloseTo(camera.quaternion.w)
    // The hook refreshes matrixWorld so the shader sees the same-frame move.
    expect(wave.matrixWorld.elements[13]).toBeCloseTo(life * 10)

    // The arc aims along the bearing projected onto the camera plane.
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
    const bearing = new THREE.Vector3(0, 1, 0)
    const px = bearing.dot(right)
    const py = bearing.dot(up)
    const norm = Math.hypot(px, py)
    const { value } = internals(wave).directionUniform
    expect(value.x).toBeCloseTo(px / norm)
    expect(value.y).toBeCloseTo(py / norm)

    wave.dispose()
  })

  it('keeps the life setter working as a phase control in automatic mode', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const wave = new SignalWave({ travel: 10, period: 2 })

    // One cycle later the setter still lands the pulse on the requested life.
    clock.mockReturnValue(3000)
    wave.life = 0.7
    expect(wave.life).toBeCloseTo(0.7, 5)

    wave.dispose()
  })

  it('creates staggered child pulses with count and disposes them together', () => {
    const wave = new SignalWave({ travel: 10, count: 6 })

    // All pulses are children; the parent itself is a static container.
    expect(wave.children).toHaveLength(6)
    wave.children.forEach((child) => expect(child).toBeInstanceOf(SignalWave))

    const scene = new THREE.Scene()
    scene.add(wave)
    wave.dispose()

    expect(wave.children).toHaveLength(0)
    expect(scene.children).not.toContain(wave)
  })

  it('faces the camera with faceCamera', () => {
    const wave = new SignalWave()
    const camera = new THREE.PerspectiveCamera()
    camera.rotation.set(0.3, 0.4, 0.5)

    wave.faceCamera(camera)

    expect(wave.quaternion.x).toBeCloseTo(camera.quaternion.x)
    expect(wave.quaternion.y).toBeCloseTo(camera.quaternion.y)
    expect(wave.quaternion.z).toBeCloseTo(camera.quaternion.z)
    expect(wave.quaternion.w).toBeCloseTo(camera.quaternion.w)

    wave.dispose()
  })

  it('blends additively without writing depth', () => {
    const wave = new SignalWave()

    expect(wave.material.transparent).toBe(true)
    expect(wave.material.depthWrite).toBe(false)
    expect(wave.material.blending).toBe(THREE.AdditiveBlending)
    expect(wave.material.fog).toBe(false)

    wave.dispose()
  })

  it('releases the geometry and the material on dispose', () => {
    const wave = new SignalWave()
    const geometrySpy = vi.spyOn(wave.geometry, 'dispose')
    const materialSpy = vi.spyOn(wave.material, 'dispose')

    wave.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const wave = new SignalWave()
    scene.add(wave)

    wave.dispose()

    expect(scene.children).not.toContain(wave)
  })

  it('is safe to dispose twice', () => {
    const wave = new SignalWave()
    const geometrySpy = vi.spyOn(wave.geometry, 'dispose')

    wave.dispose()
    expect(() => wave.dispose()).not.toThrow()
    expect(geometrySpy).toHaveBeenCalledTimes(1)
  })
})
