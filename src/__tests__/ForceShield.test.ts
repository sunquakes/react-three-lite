import * as THREE from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ForceShield from '../utils/ForceShield'

// The uniform slots are private, but they are the only way to observe what the
// shader will draw, so the tests read them through a narrow structural cast.
interface ForceShieldInternals {
  uniforms: {
    uReveal: { value: number }
    uLife: { value: number }
    hitPos: Array<{ value: THREE.Vector3 }>
    hitTime: Array<{ value: number }>
  }
  tick: () => void
}

function internals(shield: ForceShield): ForceShieldInternals {
  return shield as unknown as ForceShieldInternals
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ForceShield', () => {
  it('starts raised, intact and fully visible', () => {
    const shield = new ForceShield()

    expect(shield.active).toBe(true)
    expect(shield.reveal).toBe(0)
    expect(shield.life).toBe(1)
    expect(shield.shieldRadius).toBe(1.8)

    shield.dispose()
  })

  it('honours the radius and life options', () => {
    const shield = new ForceShield({ radius: 3, life: 0.5 })

    expect(shield.shieldRadius).toBe(3)
    expect(shield.life).toBeCloseTo(0.5)
    expect(shield.geometry.parameters.radius).toBe(3)

    shield.dispose()
  })

  it('starts dissolved when created inactive', () => {
    const shield = new ForceShield({ active: false })

    expect(shield.active).toBe(false)
    expect(shield.reveal).toBe(1)

    shield.dispose()
  })

  it('clamps life and reveal writes to the 0-1 range', () => {
    const shield = new ForceShield()

    shield.life = 4
    expect(shield.life).toBe(1)
    shield.life = -2
    expect(shield.life).toBe(0)

    shield.reveal = 3
    expect(shield.reveal).toBe(1)
    shield.reveal = -1
    expect(shield.reveal).toBe(0)

    shield.dispose()
  })

  it('dissolves by itself after setActive(false)', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const shield = new ForceShield({ revealSpeed: 3.5 })
    const state = internals(shield)

    expect(shield.reveal).toBe(0)

    shield.setActive(false)
    now = 1000
    state.tick()

    expect(shield.reveal).toBeGreaterThan(0)
    expect(shield.reveal).toBeLessThan(1)

    // Enough frames snap the dissolve to fully dissolved.
    for (let i = 0; i < 60; i += 1) {
      now += 100
      state.tick()
    }
    expect(shield.reveal).toBe(1)

    shield.dispose()
  })

  it('freezes the dissolve when reveal is written directly', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const shield = new ForceShield()
    const state = internals(shield)

    shield.reveal = 0.4
    shield.setActive(false)

    // setActive() hands control back to the animation, so pin it again.
    shield.reveal = 0.4
    now = 2000
    state.tick()

    expect(shield.reveal).toBeCloseTo(0.4)

    shield.dispose()
  })

  it('records a hit at the given world-space point', () => {
    const shield = new ForceShield({ radius: 2 })
    const { uniforms } = internals(shield)

    shield.hit(new THREE.Vector3(0, 0, 2))

    expect(uniforms.hitPos[0].value.x).toBeCloseTo(0)
    expect(uniforms.hitPos[0].value.y).toBeCloseTo(0)
    expect(uniforms.hitPos[0].value.z).toBeCloseTo(2)
    expect(uniforms.hitTime[0].value).toBeGreaterThanOrEqual(0)

    shield.dispose()
  })

  it('puts an omitted hit point on the shield surface', () => {
    const shield = new ForceShield({ radius: 2 })
    const { uniforms } = internals(shield)

    shield.hit()

    expect(uniforms.hitPos[0].value.length()).toBeCloseTo(2)

    shield.dispose()
  })

  it('drains life by hitDamage percent per hit', () => {
    const shield = new ForceShield({ hitDamage: 20 })

    shield.hit()
    expect(shield.life).toBeCloseTo(0.8)

    shield.hit(undefined, 5)
    expect(shield.life).toBeCloseTo(0.75)

    shield.dispose()
  })

  it('never drops life below zero', () => {
    const shield = new ForceShield({ hitDamage: 60 })

    shield.hit()
    shield.hit()

    expect(shield.life).toBe(0)

    shield.dispose()
  })

  it('recycles the six impact slots in a ring buffer', () => {
    const shield = new ForceShield()
    const { uniforms } = internals(shield)

    for (let i = 0; i < 7; i += 1) shield.hit(new THREE.Vector3(i, 0, 0))

    // The seventh hit lands back in the first slot.
    expect(uniforms.hitPos[0].value.x).toBeCloseTo(6)

    shield.dispose()
  })

  it('releases the geometry and the material on dispose', () => {
    const shield = new ForceShield()
    const geometrySpy = vi.spyOn(shield.geometry, 'dispose')
    const materialSpy = vi.spyOn(shield.material, 'dispose')

    shield.dispose()

    expect(geometrySpy).toHaveBeenCalledTimes(1)
    expect(materialSpy).toHaveBeenCalledTimes(1)
  })

  it('detaches itself from the scene on dispose', () => {
    const scene = new THREE.Scene()
    const shield = new ForceShield()
    scene.add(shield)

    shield.dispose()

    expect(scene.children).not.toContain(shield)
  })

  it('is safe to dispose twice', () => {
    const shield = new ForceShield()
    const geometrySpy = vi.spyOn(shield.geometry, 'dispose')

    shield.dispose()
    expect(() => shield.dispose()).not.toThrow()
    expect(geometrySpy).toHaveBeenCalledTimes(1)
  })
})
