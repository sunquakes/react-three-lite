import { describe, expect, it } from 'vitest'
import { generateUUID } from '../utils/UUID'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('generateUUID', () => {
  it('produces a well formed version 4 UUID', () => {
    expect(generateUUID()).toMatch(UUID_V4)
  })

  it('produces a valid UUID no matter what the random source returns', () => {
    // The variant nibble is derived with bit math, so both ends of the random
    // range must still land in the [89ab] set.
    const original = Math.random
    try {
      for (const value of [0, 0.999999, 0.5]) {
        Math.random = () => value
        expect(generateUUID()).toMatch(UUID_V4)
      }
    } finally {
      Math.random = original
    }
  })

  it('does not collide across a large batch', () => {
    const ids = new Set(Array.from({ length: 5000 }, () => generateUUID()))

    expect(ids.size).toBe(5000)
  })
})
