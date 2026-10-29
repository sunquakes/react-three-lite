import * as THREE from 'three'
import { time } from 'three/tsl'
import { describe, expect, it, vi } from 'vitest'
import RadarSweep from '../utils/RadarSweep'

// `rebuild` and the `added` listener are private implementation details, but
// they are exactly what the terrain conformity and cleanup contracts touch, so
// the tests read them through a narrow structural cast.
interface RadarSweepInternals {
  onAdded: () => void
}

function internals(sweep: RadarSweep): RadarSweepInternals {
  return sweep as unknown as RadarSweepInternals
}

function yValues(sweep: RadarSweep): number[] {
  const positions = sweep.geometry.attributes.position as THREE.BufferAttribute
  const values: number[] = []
  for (let i = 0; i < positions.count; i += 1) values.push(positions.getY(i))
  return values
}

describe('RadarSweep', () => {
  it('lays the ring flat on the ground plane', () => {
    const sweep = new RadarSweep({ radius: 5 })

    sweep.geometry.computeBoundingBox()
    const box = sweep.geometry.boundingBox!

    // RingGeometry is built in XY, so a flat band has a zero-height box.
    expect(box.max.y - box.min.y).toBeCloseTo(0)
    expect(box.max.x).toBeCloseTo(5)

    sweep.dispose()
  })

  it('starts at the origin and exposes progress', () => {
    const sweep = new RadarSweep()

    expect(sweep.progress).toBe(0)

    sweep.progress = 0.4
    expect(sweep.progress).toBeCloseTo(0.4)

    sweep.dispose()
  })

  it('honours the initial progress option', () => {
    const sweep = new RadarSweep({ progress: 0.25 })

    expect(sweep.progress).toBeCloseTo(0.25)

    sweep.dispose()
  })

  it('loops on its own when a period is given', () => {
    const sweep = new RadarSweep({ period: 2, progress: 0.25 })

    // The getter derives the progress from the render timer plus the phase.
    const t = (time as unknown as { value: number }).value ?? 0
    const expected = (((t / 2 + 0.25) % 1) + 1) % 1
    expect(sweep.progress).toBeCloseTo(expected)

    // Writing progress shifts the phase and reads back the same value.
    sweep.progress = 0.6
    expect(sweep.progress).toBeCloseTo(0.6, 5)

    sweep.dispose()
  })

  it('stands the band on the terrain from the heightAt sampler', () => {
    const sweep = new RadarSweep({ heightAt: () => 2, lift: 0.1 })
    sweep.rebuild()

    yValues(sweep).forEach((y) => expect(y).toBeCloseTo(2.1))

    sweep.dispose()
  })

  it('samples heightAt in world space, offset by the mesh position', () => {
    const sampled: Array<[number, number]> = []
    const sweep = new RadarSweep({
      radius: 5,
      heightAt: (x, z) => {
        sampled.push([x, z])
        return 0
      }
    })
    sweep.position.set(3, 1, -4)

    sweep.rebuild()

    expect(sampled.length).toBeGreaterThan(0)
    // Every sample is shifted by the mesh position, so the sampled footprint is
    // centred on (3, -4) rather than on the local origin.
    const xs = sampled.map(([x]) => x)
    const zs = sampled.map(([, z]) => z)
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(3, 1)
    expect((Math.min(...zs) + Math.max(...zs)) / 2).toBeCloseTo(-4, 1)

    sweep.dispose()
  })

  it('keeps the band flat when no heightAt sampler is given', () => {
    const sweep = new RadarSweep()

    expect(() => sweep.rebuild()).not.toThrow()
    yValues(sweep).forEach((y) => expect(y).toBeCloseTo(0))

    sweep.dispose()
  })

  it('rebuilds once it is added to the scene', () => {
    const scene = new THREE.Scene()
    const sweep = new RadarSweep({ heightAt: () => 1.5 })
    sweep.position.set(0, 0, 0)

    scene.add(sweep)

    yValues(sweep).forEach((y) => expect(y).toBeCloseTo(1.5 + 0.04))

    sweep.dispose()
  })

  it('removes the added listener on dispose so the sweep can be garbage collected', () => {
    const sweep = new RadarSweep()
    const { onAdded } = internals(sweep)
    expect(sweep.hasEventListener('added', onAdded)).toBe(true)

    sweep.dispose()

    expect(sweep.hasEventListener('added', onAdded)).toBe(false)
  })

  it('releases the geometry and the material on dispose', () => {
    const sweep = new RadarSweep()
    const geometrySpy = vi.spyOn(sweep.geometry, 'dispose')
    const materialSpy = vi.spyOn(sweep.material, 'dispose')

    sweep.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const sweep = new RadarSweep()
    scene.add(sweep)

    sweep.dispose()

    expect(scene.children).not.toContain(sweep)
  })

  it('is safe to dispose twice', () => {
    const sweep = new RadarSweep()
    const geometrySpy = vi.spyOn(sweep.geometry, 'dispose')

    sweep.dispose()
    expect(() => sweep.dispose()).not.toThrow()
    expect(geometrySpy).toHaveBeenCalledTimes(1)
  })
})
