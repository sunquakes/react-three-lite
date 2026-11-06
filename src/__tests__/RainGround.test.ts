import { describe, expect, it } from 'vitest'
import {
  RAIN_FALL_RATE,
  createFlatHeightMap,
  resolveRainGround,
  splashProgressWindow
} from '../utils/RainGround'

describe('resolveRainGround', () => {
  it('defaults the ground to the bottom of the rain volume', () => {
    const ground = resolveRainGround({
      height: 20,
      range: 30,
      splashDuration: 0.6,
      speed: 1
    })

    expect(ground.base).toBe(-10)
    expect(ground.amplitude).toBeCloseTo(8)
    expect(ground.mapSize).toBe(30)
    expect(ground.splashWindow).toBeCloseTo(0.6 * RAIN_FALL_RATE)
  })

  it('keeps explicit ground options and never returns a zero sized map', () => {
    const ground = resolveRainGround({
      height: 20,
      range: 30,
      groundHeight: -4,
      heightMapAmplitude: 6,
      heightMapSize: 0,
      splashDuration: 0.6,
      speed: 1
    })

    expect(ground.base).toBe(-4)
    expect(ground.amplitude).toBe(6)
    expect(ground.mapSize).toBeGreaterThan(0)
  })

  it('clamps a negative height map amplitude to a flat map', () => {
    const ground = resolveRainGround({
      height: 20,
      range: 30,
      heightMapAmplitude: -5,
      splashDuration: 0.6,
      speed: 1
    })

    expect(ground.amplitude).toBe(0)
  })
})

describe('splashProgressWindow', () => {
  it('scales with the animation speed', () => {
    expect(splashProgressWindow(0.5, 2)).toBeCloseTo(splashProgressWindow(0.5, 1) * 2)
  })

  it('never collapses to zero and never outlives a fall cycle', () => {
    expect(splashProgressWindow(0, 1)).toBeGreaterThan(0)
    expect(splashProgressWindow(100, 5)).toBeLessThan(1)
  })
})

describe('createFlatHeightMap', () => {
  it('returns a transparent-black 1x1 map so the sampled ground stays flat', () => {
    const map = createFlatHeightMap()

    expect(map.image.width).toBe(1)
    expect(map.image.height).toBe(1)
    expect(Array.from(map.image.data as Uint8Array)).toEqual([0, 0, 0, 255])

    map.dispose()
  })
})
