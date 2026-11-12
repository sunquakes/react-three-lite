import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { ParameterBus, globalParameterBus } from '../utils/ParameterBus'

describe('ParameterBus', () => {
  it('shares a normalized sun direction by default', () => {
    const bus = new ParameterBus()
    const direction = bus.get('sunDirection')

    expect(direction.length()).toBeCloseTo(1)
    expect(direction.x).toBeLessThan(0)
    expect(direction.y).toBeGreaterThan(0)
    expect(direction.z).toBeLessThan(0)
  })

  it('normalizes the value passed to set', () => {
    const bus = new ParameterBus()
    bus.set('sunDirection', new THREE.Vector3(0, 4, 0))

    expect(bus.get('sunDirection').toArray()).toEqual([0, 1, 0])
  })

  it('notifies subscribers with the next and previous values', () => {
    const bus = new ParameterBus()
    const previous = bus.get('sunDirection').clone()
    const listener = vi.fn()

    bus.subscribe('sunDirection', listener)
    bus.set('sunDirection', new THREE.Vector3(0, 1, 0))

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(new THREE.Vector3(0, 1, 0), previous)
  })

  it('stops notifying after unsubscribe', () => {
    const bus = new ParameterBus()
    const listener = vi.fn()
    const unsubscribe = bus.subscribe('sunDirection', listener)

    unsubscribe()
    bus.set('sunDirection', new THREE.Vector3(0, 1, 0))

    expect(listener).not.toHaveBeenCalled()
  })

  it('restores the default value on reset', () => {
    const bus = new ParameterBus()
    const defaultDirection = bus.get('sunDirection').clone()
    const listener = vi.fn()

    bus.set('sunDirection', new THREE.Vector3(0, 1, 0))
    bus.subscribe('sunDirection', listener)
    bus.reset()

    expect(bus.get('sunDirection').toArray()).toEqual(defaultDirection.toArray())
    expect(listener).toHaveBeenCalledWith(defaultDirection, new THREE.Vector3(0, 1, 0))
  })

  it('exports a shared bus instance', () => {
    expect(globalParameterBus).toBeInstanceOf(ParameterBus)
  })
})
