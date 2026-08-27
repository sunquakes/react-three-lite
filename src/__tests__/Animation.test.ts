import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Animation from '../utils/Animation'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

function createClip(name: string): THREE.AnimationClip {
  const track = new THREE.NumberKeyframeTrack('.scale[x]', [0, 1], [1, 2])
  return new THREE.AnimationClip(name, 1, [track])
}

function createModel(clipNames: string[] = []): THREE.Mesh & { animations: THREE.AnimationClip[] } {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
  mesh.animations = clipNames.map(createClip)
  return mesh as THREE.Mesh & { animations: THREE.AnimationClip[] }
}

describe('Animation', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('constructor', () => {
    it('picks up the clips carried by the model', () => {
      const animation = new Animation(createModel(['idle', 'walk']))

      expect(animation.animations).toHaveLength(2)
      expect(animation.mixer).toBeInstanceOf(THREE.AnimationMixer)

      animation.dispose()
    })

    it('prefers explicitly passed clips over the ones on the model', () => {
      const explicit = [createClip('custom')]
      const animation = new Animation(createModel(['idle']), explicit)

      expect(animation.animations).toBe(explicit)

      animation.dispose()
    })

    it('falls back to an empty list for a model without animations', () => {
      const animation = new Animation(new THREE.Object3D())

      expect(animation.animations).toEqual([])

      animation.dispose()
    })

    it('defaults to a repeating loop and a fixed frame delta', () => {
      const animation = new Animation(createModel(['idle']))

      expect(animation.loop).toBe(THREE.LoopRepeat)
      expect(animation.deltaTime).toBeCloseTo(0.016)
      expect(animation.index).toBe(0)

      animation.dispose()
    })
  })

  describe('clip selection', () => {
    it('selects a clip by index and returns itself for chaining', () => {
      const animation = new Animation(createModel(['idle', 'walk']))

      expect(animation.set(1)).toBe(animation)
      expect(animation.index).toBe(1)

      animation.dispose()
    })

    it('selects a clip by name', () => {
      const animation = new Animation(createModel(['idle', 'walk', 'run']))

      animation.setByName('run')

      expect(animation.index).toBe(2)

      animation.dispose()
    })

    it('yields index -1 for an unknown clip name, so play throws instead of guessing', () => {
      const animation = new Animation(createModel(['idle']))

      animation.setByName('missing')

      expect(animation.index).toBe(-1)
      expect(() => animation.play()).toThrow()

      animation.dispose()
    })

    it('drops the cached action when the selection changes', () => {
      const animation = new Animation(createModel(['idle', 'walk']))
      animation.play()
      expect(animation.clipAction).not.toBeNull()

      animation.set(1)

      expect(animation.clipAction).toBeNull()

      animation.dispose()
    })
  })

  describe('play', () => {
    it('creates an action for the selected clip and starts the frame loop', () => {
      const animation = new Animation(createModel(['idle', 'walk']))

      animation.setByName('walk').play()

      expect(animation.clipAction).not.toBeNull()
      expect(animation.clipAction?.getClip().name).toBe('walk')
      expect(animation.isAnimating).toBe(true)
      expect(raf.request).toHaveBeenCalledTimes(1)

      animation.dispose()
    })

    it('applies the configured loop mode to the new action', () => {
      const animation = new Animation(createModel(['idle']))

      animation.setLoop(THREE.LoopOnce).play()

      expect(animation.loop).toBe(THREE.LoopOnce)
      expect(animation.clipAction?.loop).toBe(THREE.LoopOnce)

      animation.dispose()
    })

    it('reuses the existing action on a second play, keeping a single frame loop', () => {
      const animation = new Animation(createModel(['idle']))

      animation.play()
      const action = animation.clipAction
      animation.play()

      expect(animation.clipAction).toBe(action)
      expect(raf.request).toHaveBeenCalledTimes(1)

      animation.dispose()
    })

    it('throws a descriptive error when there is nothing to play', () => {
      const animation = new Animation(new THREE.Object3D())

      expect(() => animation.play()).toThrow('No animations found')

      animation.dispose()
    })

    it('drives the mixer forward on every frame', () => {
      const animation = new Animation(createModel(['idle']))
      const update = vi.spyOn(animation.mixer, 'update')
      animation.play()

      // `play` ticks once synchronously before handing over to the frame loop.
      expect(update).toHaveBeenCalledTimes(1)

      raf.flush()
      raf.flush()

      expect(update).toHaveBeenCalledTimes(3)
      expect(update).toHaveBeenCalledWith(animation.deltaTime)

      animation.dispose()
    })
  })

  describe('playAll', () => {
    it('creates one action per clip', () => {
      const animation = new Animation(createModel(['idle', 'walk', 'run']))

      animation.playAll()

      expect(animation.clipActions).toHaveLength(3)
      expect(animation.isAnimating).toBe(true)

      animation.dispose()
    })

    it('throws when there is nothing to play', () => {
      const animation = new Animation(new THREE.Object3D())

      expect(() => animation.playAll()).toThrow('No animations found')

      animation.dispose()
    })
  })

  describe('property forwarding', () => {
    it('forwards the time scale to the active action', () => {
      const animation = new Animation(createModel(['idle']))
      animation.play()

      animation.setTimeScale(2)

      expect(animation.clipAction?.timeScale).toBe(2)

      animation.dispose()
    })

    it('forwards clampWhenFinished to the active action', () => {
      const animation = new Animation(createModel(['idle']))
      animation.play()

      animation.setClampWhenFinished(true)

      expect(animation.clipAction?.clampWhenFinished).toBe(true)

      animation.dispose()
    })

    it('forwards a property to every action started by playAll', () => {
      const animation = new Animation(createModel(['idle', 'walk']))
      animation.playAll()

      animation.setTimeScale(0.5)

      animation.clipActions.forEach((action) => expect(action.timeScale).toBe(0.5))

      animation.dispose()
    })

    it('is a no-op when nothing is playing yet', () => {
      const animation = new Animation(createModel(['idle']))

      expect(() => animation.setTimeScale(2)).not.toThrow()

      animation.dispose()
    })
  })

  describe('pause and stop', () => {
    it('pauses the active action without tearing down the loop', () => {
      const animation = new Animation(createModel(['idle']))
      animation.play()

      animation.pause()

      expect(animation.clipAction?.paused).toBe(true)

      animation.dispose()
    })

    it('stops the active action', () => {
      const animation = new Animation(createModel(['idle']))
      animation.play()

      animation.stop()

      expect(animation.clipAction?.isRunning()).toBe(false)

      animation.dispose()
    })

    it('pauses and stops every action started by playAll', () => {
      const animation = new Animation(createModel(['idle', 'walk']))
      animation.playAll()

      animation.pauseAll()
      animation.clipActions.forEach((action) => expect(action.paused).toBe(true))

      animation.stopAll()
      animation.clipActions.forEach((action) => expect(action.isRunning()).toBe(false))

      animation.dispose()
    })
  })

  describe('dispose', () => {
    it('cancels the frame loop and clears the action caches', () => {
      const animation = new Animation(createModel(['idle', 'walk']))
      animation.playAll()
      const stopAllAction = vi.spyOn(animation.mixer, 'stopAllAction')

      animation.dispose()

      expect(raf.cancel).toHaveBeenCalledTimes(1)
      expect(raf.pending.size).toBe(0)
      expect(animation.isAnimating).toBe(false)
      expect(animation.clipActions).toEqual([])
      expect(animation.clipAction).toBeNull()
      expect(stopAllAction).toHaveBeenCalledTimes(1)
    })

    it('is safe to call before anything was played', () => {
      const animation = new Animation(createModel(['idle']))

      expect(() => animation.dispose()).not.toThrow()
    })
  })
})
