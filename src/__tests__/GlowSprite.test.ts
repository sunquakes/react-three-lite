import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GlowSprite from '../utils/GlowSprite'

describe('GlowSprite', () => {
  beforeEach(() => {
    // jsdom ships no 2D canvas and logs a "not implemented" error for every
    // getContext call. The sprite already guards a null context, so stub it out
    // and keep the run output clean.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (() => null) as typeof HTMLCanvasElement.prototype.getContext
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('paints its halo into an sRGB canvas texture', () => {
    const sprite = new GlowSprite()

    expect(sprite.material.map).toBeInstanceOf(THREE.CanvasTexture)
    expect(sprite.material.map!.colorSpace).toBe(THREE.SRGBColorSpace)

    sprite.dispose()
  })

  it('sizes the sprite from the size option', () => {
    const sprite = new GlowSprite({ size: 4.5 })

    expect(sprite.scale.x).toBeCloseTo(4.5)
    expect(sprite.scale.y).toBeCloseTo(4.5)
    expect(sprite.scale.z).toBeCloseTo(4.5)

    sprite.dispose()
  })

  it('blends additively without writing depth', () => {
    const sprite = new GlowSprite({ opacity: 0.5 })

    expect(sprite.material.transparent).toBe(true)
    expect(sprite.material.opacity).toBeCloseTo(0.5)
    expect(sprite.material.blending).toBe(THREE.AdditiveBlending)
    expect(sprite.material.depthWrite).toBe(false)
    expect(sprite.material.fog).toBe(false)

    sprite.dispose()
  })

  it('releases the texture and the material on dispose', () => {
    const sprite = new GlowSprite()
    const texture = sprite.material.map!
    const textureSpy = vi.spyOn(texture, 'dispose')
    const materialSpy = vi.spyOn(sprite.material, 'dispose')

    sprite.dispose()

    expect(textureSpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
    expect(sprite.material.map).toBeNull()
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const sprite = new GlowSprite()
    scene.add(sprite)

    sprite.dispose()

    expect(scene.children).not.toContain(sprite)
  })

  it('is safe to dispose twice', () => {
    const sprite = new GlowSprite()
    const texture = sprite.material.map!
    const textureSpy = vi.spyOn(texture, 'dispose')

    sprite.dispose()
    expect(() => sprite.dispose()).not.toThrow()
    expect(textureSpy).toHaveBeenCalledTimes(1)
  })

  it('breathes on its own when a pulsePeriod is given', () => {
    // The sprite runs on its own monotonic clock, so pin it to drive the cycle.
    const clock = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const sprite = new GlowSprite({ size: 4, opacity: 0.8, pulsePeriod: 2, phase: 0.25 })
    const scene = new THREE.Scene()
    scene.add(sprite)

    // 500ms in, plus the 0.25 phase, lands on half of the breathing cycle.
    clock.mockReturnValue(1500)

    // Invoke the automatic per-render hook the way the renderers do.
    ;(sprite.onBeforeRender as unknown as () => void)()

    const life = 0.5
    const breath = 0.5 - 0.5 * Math.cos(life * Math.PI * 2)

    expect(sprite.scale.x).toBeCloseTo(4 * (1 + (breath * 2 - 1) * 0.12))
    expect(sprite.material.opacity).toBeCloseTo(0.8 * (0.75 + breath * 0.25))
    // The hook refreshes matrixWorld so the shader sees the same-frame size.
    expect(sprite.matrixWorld.elements[0]).toBeCloseTo(sprite.scale.x)

    sprite.dispose()
  })

  it('stays still without a pulsePeriod', () => {
    const sprite = new GlowSprite({ size: 4, opacity: 0.8 })

    ;(sprite.onBeforeRender as unknown as () => void)()

    expect(sprite.scale.x).toBeCloseTo(4)
    expect(sprite.material.opacity).toBeCloseTo(0.8)

    sprite.dispose()
  })
})
