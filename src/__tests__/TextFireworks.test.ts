import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TextFireworks from '../utils/TextFireworks'
import { installFakeCanvas } from './helpers/fakeCanvas'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

interface TextFireworksInternals {
  animationId: number | null
  uPhase: { value: number }
  uBurstScale: { value: number }
  uPixelRatio: { value: number }
  baseColors: Float32Array
  pointsMaterial: THREE.Material
  trailMaterial: THREE.Material
}

function internals(fireworks: TextFireworks): TextFireworksInternals {
  return fireworks as unknown as TextFireworksInternals
}

function waitForTimer(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10))
}

describe('TextFireworks', () => {
  let raf: FakeRaf
  let restoreCanvas: () => void

  beforeEach(() => {
    raf = installFakeRaf()
    // A lit band across the canvas keeps the sampled cloud small but still
    // spreads particles over all four burst groups.
    restoreCanvas = installFakeCanvas({ rect: { x: 100, y: 180, width: 1200, height: 60 } })
  })

  afterEach(() => {
    restoreCanvas()
    vi.unstubAllGlobals()
  })

  it('renders a main layer and a trail layer that share one geometry', () => {
    const fireworks = new TextFireworks({ autoPlay: false })

    expect(fireworks).toBeInstanceOf(THREE.Group)
    expect(fireworks.children).toHaveLength(2)
    expect(fireworks.points.geometry).toBe(fireworks.trail.geometry)
    expect(fireworks.points).not.toBe(fireworks.trail)
    expect(fireworks.particleCount).toBeGreaterThan(0)

    const geometry = fireworks.points.geometry
    ;['position', 'uv', 'aOrigin', 'aCenter', 'aBurst', 'aDelay', 'aColor', 'aSize'].forEach(
      (name) => {
        expect(geometry.getAttribute(name), `${name} attribute`).toBeDefined()
      }
    )

    expect(geometry.getIndex()?.count).toBe(fireworks.particleCount * 6)
    expect(fireworks.points.frustumCulled).toBe(false)
    expect(fireworks.trail.frustumCulled).toBe(false)
    const material = fireworks.points.material as THREE.Material
    expect(material.transparent).toBe(true)
    expect(material.depthWrite).toBe(false)
    expect(material.blending).toBe(THREE.AdditiveBlending)
    expect(fireworks.points.material).not.toBe(fireworks.trail.material)

    fireworks.dispose()
  })

  it('bakes deterministic per-particle randomness from the seed', () => {
    const first = new TextFireworks({ autoPlay: false })
    const second = new TextFireworks({ autoPlay: false })

    expect(first.particleCount).toBe(second.particleCount)
    expect(Array.from(first.points.geometry.getAttribute('aDelay').array)).toEqual(
      Array.from(second.points.geometry.getAttribute('aDelay').array)
    )
    expect(Array.from(first.points.geometry.getAttribute('aBurst').array)).toEqual(
      Array.from(second.points.geometry.getAttribute('aBurst').array)
    )

    first.dispose()
    second.dispose()
  })

  it('assigns every particle to a configured burst centre', () => {
    const fireworks = new TextFireworks({
      autoPlay: false,
      colors: [0xff0000],
      burstCenters: [[1, 2]]
    })
    const centers = fireworks.points.geometry.getAttribute('aCenter')

    for (let i = 0; i < fireworks.particleCount; i += 1) {
      expect(centers.getX(i * 4)).toBeCloseTo(1, 0)
      expect(centers.getY(i * 4)).toBeCloseTo(2, 0)
    }

    expect(internals(fireworks).uBurstScale.value).toBe(1)

    fireworks.dispose()
  })

  it('applies the burst scale uniform and advances the timeline on update', () => {
    const fireworks = new TextFireworks({ autoPlay: false, burstScale: 0.5 })

    expect(internals(fireworks).uBurstScale.value).toBe(0.5)

    fireworks.launch()
    fireworks.update(0.5)

    expect(internals(fireworks).uPhase.value).toBeCloseTo(0.5)
    expect(fireworks.phase).toBeCloseTo(0.5)

    fireworks.dispose()
  })

  it('starts a single frame loop per launch and stops at the end of the cycle', () => {
    const fireworks = new TextFireworks({ autoPlay: false })

    expect(raf.request).not.toHaveBeenCalled()

    fireworks.launch()
    fireworks.launch()

    expect(raf.request).toHaveBeenCalledTimes(1)
    expect(fireworks.playing).toBe(true)

    fireworks.update(fireworks.duration)
    raf.flush()

    expect(fireworks.phase).toBe(fireworks.duration)
    expect(fireworks.playing).toBe(false)
    expect(raf.pending.size).toBe(0)

    fireworks.dispose()
  })

  it('re-samples the glyph when the text changes and settles back at rest', () => {
    const fireworks = new TextFireworks({ autoPlay: false })
    const previousGeometry = fireworks.points.geometry
    const disposePrevious = vi.spyOn(previousGeometry, 'dispose')

    fireworks.launch()
    fireworks.update(1)
    fireworks.setText('Happy Birthday')

    expect(fireworks.text).toBe('Happy Birthday')
    expect(fireworks.points.geometry).not.toBe(previousGeometry)
    expect(fireworks.points.geometry).toBe(fireworks.trail.geometry)
    expect(disposePrevious).toHaveBeenCalledTimes(1)
    expect(fireworks.phase).toBe(0)
    expect(fireworks.playing).toBe(false)
    expect(raf.cancel).toHaveBeenCalled()

    fireworks.dispose()
  })

  it('ignores blank text so the current glyph is kept', () => {
    const fireworks = new TextFireworks({ autoPlay: false })

    fireworks.setText('   ')

    expect(fireworks.text).toBe('Good things are coming')

    fireworks.dispose()
  })

  it('pre-corrects vertex colours on the WebGPU path', () => {
    const fireworks = new TextFireworks({ autoPlay: false })
    const baseColors = internals(fireworks).baseColors
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: true, getPixelRatio: () => 2 }
    scene.add(fireworks)

    const colors = fireworks.points.geometry.getAttribute('aColor')

    expect(colors.getX(0)).toBeCloseTo(Math.pow(baseColors[0], 2.2) * 0.86, 5)
    expect(colors.getZ(0)).toBeCloseTo(Math.pow(baseColors[2], 2.2) * 0.86, 5)
    expect(internals(fireworks).uPixelRatio.value).toBe(2)

    fireworks.dispose()
  })

  it('keeps raw vertex colours on the WebGL path', () => {
    const fireworks = new TextFireworks({ autoPlay: false })
    const baseColors = internals(fireworks).baseColors
    const scene = new THREE.Scene()
    scene.userData.renderer = { isWebGPURenderer: false, getPixelRatio: () => 1 }
    scene.add(fireworks)

    expect(fireworks.points.geometry.getAttribute('aColor').getX(0)).toBeCloseTo(baseColors[0], 6)

    fireworks.dispose()
  })

  it('auto plays once after the configured delay', async () => {
    const fireworks = new TextFireworks({ autoPlayDelay: 0 })

    expect(raf.request).not.toHaveBeenCalled()

    await waitForTimer()

    expect(raf.request).toHaveBeenCalledTimes(1)

    fireworks.dispose()
  })

  it('cancels the automatic launch when disposed before it fires', async () => {
    const fireworks = new TextFireworks({ autoPlayDelay: 0 })

    fireworks.dispose()
    await waitForTimer()

    expect(raf.request).not.toHaveBeenCalled()
  })

  it('releases the frame loop, geometry and both materials on dispose', () => {
    const fireworks = new TextFireworks({ autoPlay: false })
    fireworks.launch()

    const disposeGeometry = vi.spyOn(fireworks.points.geometry, 'dispose')
    const disposePoints = vi.spyOn(internals(fireworks).pointsMaterial, 'dispose')
    const disposeTrail = vi.spyOn(internals(fireworks).trailMaterial, 'dispose')

    fireworks.dispose()

    expect(disposeGeometry).toHaveBeenCalledTimes(1)
    expect(disposePoints).toHaveBeenCalledTimes(1)
    expect(disposeTrail).toHaveBeenCalledTimes(1)
    expect(internals(fireworks).animationId).toBeNull()
    expect(raf.cancel).toHaveBeenCalled()
    expect(fireworks.children).toHaveLength(0)

    fireworks.dispose()

    expect(disposeGeometry).toHaveBeenCalledTimes(1)
    expect(disposePoints).toHaveBeenCalledTimes(1)
  })
})
