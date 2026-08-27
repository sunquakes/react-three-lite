import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Movable from '../utils/Movable'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

interface MovableInternals {
  duration: number
  deltaX: number
  deltaY: number
  deltaZ: number
  state: boolean
  start: number | undefined
  animationId: number | null
}

function internals(movable: Movable): MovableInternals {
  return movable as unknown as MovableInternals
}

describe('Movable', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('lerp', () => {
    it('returns the endpoints at t = 0 and t = 1', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      expect(movable.lerp(2, 10, 0)).toBe(2)
      expect(movable.lerp(2, 10, 1)).toBe(10)
    })

    it('interpolates linearly in between', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      expect(movable.lerp(0, 10, 0.25)).toBe(2.5)
      expect(movable.lerp(-10, 10, 0.5)).toBe(0)
    })
  })

  describe('calculateRotate', () => {
    it('returns null when there is no movement, so the current rotation is kept', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      expect(movable.calculateRotate(0, 0)).toBeNull()
    })

    it('faces the pure x directions when z is zero', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      expect(movable.calculateRotate(1, 0)).toBe(Math.PI / 2)
      expect(movable.calculateRotate(-1, 0)).toBe(-Math.PI / 2)
    })

    it('maps each quadrant onto a continuous angle', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      // +x / +z
      expect(movable.calculateRotate(1, 1)).toBeCloseTo(Math.PI / 4)
      // +x / -z needs the PI offset to stay on the correct side
      expect(movable.calculateRotate(1, -1)).toBeCloseTo(-Math.PI / 4 + Math.PI)
      // -x / +z
      expect(movable.calculateRotate(-1, 1)).toBeCloseTo(-Math.PI / 4)
      // -x / -z
      expect(movable.calculateRotate(-1, -1)).toBeCloseTo(Math.PI / 4 + Math.PI)
    })
  })

  describe('constructor', () => {
    it('snaps the group to the initial position', () => {
      const group = new THREE.Group()

      new Movable(group, [1, 2, 3])

      expect(group.position.toArray()).toEqual([1, 2, 3])
    })

    it('does not start a frame loop until a move is requested', () => {
      new Movable(new THREE.Group(), [0, 0, 0])

      expect(raf.request).not.toHaveBeenCalled()
    })
  })

  describe('moveTo', () => {
    it('records the remaining distance and duration', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      movable.moveTo([10, 20, 30], 1000)

      const state = internals(movable)
      expect(state.duration).toBe(1000)
      expect([state.deltaX, state.deltaY, state.deltaZ]).toEqual([10, 20, 30])
    })

    it('accumulates consecutive moves instead of replacing them', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      movable.moveTo([10, 0, 0], 1000)
      movable.moveTo([15, 0, 0], 500)

      const state = internals(movable)
      expect(state.duration).toBe(1500)
      expect(state.deltaX).toBe(15)
    })

    it('starts the frame loop once, no matter how many moves are queued', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      movable.moveTo([1, 0, 0], 100)
      movable.moveTo([2, 0, 0], 100)
      movable.moveTo([3, 0, 0], 100)

      expect(raf.request).toHaveBeenCalledTimes(1)
      expect(internals(movable).state).toBe(true)
    })
  })

  describe('update', () => {
    it('does not move on the very first frame, which only samples the clock', () => {
      const group = new THREE.Group()
      const movable = new Movable(group, [0, 0, 0])
      movable.moveTo([10, 0, 0], 1000)

      raf.flush(1000)

      expect(group.position.x).toBe(0)
      expect(internals(movable).start).toBe(1000)
    })

    it('advances the group proportionally to the elapsed time', () => {
      const group = new THREE.Group()
      const movable = new Movable(group, [0, 0, 0])
      movable.moveTo([10, 0, 0], 1000)

      raf.flush(0)
      raf.flush(250)

      // 250ms of a 1000ms move -> a quarter of the remaining distance.
      expect(group.position.x).toBeCloseTo(2.5)
      expect(internals(movable).duration).toBe(750)
      expect(internals(movable).deltaX).toBeCloseTo(7.5)
    })

    it('arrives exactly on target and releases the loop', () => {
      const group = new THREE.Group()
      const movable = new Movable(group, [0, 0, 0])
      movable.moveTo([10, -5, 2], 1000)

      raf.flush(0)
      raf.flush(1000)

      expect(group.position.x).toBeCloseTo(10)
      expect(group.position.y).toBeCloseTo(-5)
      expect(group.position.z).toBeCloseTo(2)
      expect(internals(movable).state).toBe(false)
      expect(raf.pending.size).toBe(0)
    })

    it('turns the group to face the direction of travel', () => {
      const group = new THREE.Group()
      const movable = new Movable(group, [0, 0, 0])
      movable.moveTo([0, 0, 10], 1000)

      raf.flush(0)
      raf.flush(1000)

      expect(group.rotation.y).toBeCloseTo(0)
    })

    it('keeps the previous rotation when the move has no horizontal component', () => {
      const group = new THREE.Group()
      group.rotation.y = 1.23
      const movable = new Movable(group, [0, 0, 0])
      movable.moveTo([0, 5, 0], 1000)

      raf.flush(0)
      raf.flush(1000)

      expect(group.rotation.y).toBe(1.23)
    })
  })

  describe('dispose', () => {
    it('cancels a running frame loop', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])
      movable.moveTo([10, 0, 0], 1000)

      movable.dispose()

      expect(raf.cancel).toHaveBeenCalledTimes(1)
      expect(raf.pending.size).toBe(0)
      expect(internals(movable).state).toBe(false)
      expect(internals(movable).animationId).toBeNull()
    })

    it('is safe to call when no move was ever requested', () => {
      const movable = new Movable(new THREE.Group(), [0, 0, 0])

      expect(() => movable.dispose()).not.toThrow()
      expect(raf.cancel).not.toHaveBeenCalled()
    })
  })
})
