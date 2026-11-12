import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NebulaGalaxy from '../utils/NebulaGalaxy'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

interface NebulaGalaxyInternals {
  uTime: { value: number }
  uPulse: { value: number }
  uPixelRatio: { value: number }
  uCoreColor: { value: THREE.Color }
  animationId: number | null
}

function internals(galaxy: NebulaGalaxy): NebulaGalaxyInternals {
  return galaxy as unknown as NebulaGalaxyInternals
}

const SMALL = {
  armStars: 400,
  coreStars: 40,
  dustStars: 40,
  backgroundStars: 20
}

function attachToScene(galaxy: NebulaGalaxy, isWebGPU = false) {
  const canvas = document.createElement('canvas')
  const scene = new THREE.Scene()
  scene.userData.renderer = {
    isWebGPURenderer: isWebGPU,
    getPixelRatio: () => 1,
    domElement: canvas
  }
  scene.add(galaxy)

  return { scene, canvas }
}

function dispatchPointer(
  target: EventTarget,
  type: string,
  x: number,
  y: number,
  pointerId = 0
): void {
  const event = new MouseEvent(type, { clientX: x, clientY: y })
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  target.dispatchEvent(event)
}

describe('NebulaGalaxy', () => {
  let raf: FakeRaf

  beforeEach(() => {
    raf = installFakeRaf()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a galaxy disc, haze, pulse ring and background stars', () => {
    const galaxy = new NebulaGalaxy(SMALL)

    expect(galaxy).toBeInstanceOf(THREE.Group)
    expect(galaxy.children[0]).toBe(galaxy.galaxy)
    expect(galaxy.children[1]).toBe(galaxy.background)
    expect(galaxy.galaxy.children[0]).toBe(galaxy.stars)
    expect(galaxy.galaxy.children[1]).toBe(galaxy.haze)
    expect(galaxy.galaxy.children[2]).toBe(galaxy.ring)
    expect(galaxy.particleCount).toBe(SMALL.armStars + SMALL.coreStars + SMALL.dustStars)
    expect(galaxy.backgroundCount).toBe(SMALL.backgroundStars)

    const geometry = galaxy.stars.geometry
    ;['position', 'uv', 'aCenter', 'aSize', 'aMix', 'aOpacity', 'aSeed'].forEach((name) => {
      expect(geometry.getAttribute(name), `${name} attribute`).toBeDefined()
    })
    expect(geometry.getIndex()?.count).toBe(galaxy.particleCount * 6)
    expect(galaxy.background.geometry.getIndex()?.count).toBe(SMALL.backgroundStars * 6)

    for (const mesh of [galaxy.stars, galaxy.background, galaxy.haze, galaxy.ring]) {
      expect(mesh.frustumCulled).toBe(false)
      const material = mesh.material as THREE.Material
      expect(material.transparent).toBe(true)
      expect(material.depthWrite).toBe(false)
      expect(material.blending).toBe(THREE.AdditiveBlending)
    }

    expect(galaxy.stars.renderOrder).toBeGreaterThan(galaxy.haze.renderOrder)
    expect(galaxy.ring.renderOrder).toBeGreaterThan(galaxy.haze.renderOrder)

    galaxy.dispose()
  })

  it('bakes a deterministic star distribution from the seed', () => {
    const first = new NebulaGalaxy(SMALL)
    const second = new NebulaGalaxy(SMALL)

    expect(Array.from(first.stars.geometry.getAttribute('aCenter').array)).toEqual(
      Array.from(second.stars.geometry.getAttribute('aCenter').array)
    )
    expect(Array.from(first.stars.geometry.getAttribute('aMix').array)).toEqual(
      Array.from(second.stars.geometry.getAttribute('aMix').array)
    )

    first.dispose()
    second.dispose()
  })

  it('keeps every arm star inside the configured radius', () => {
    const galaxy = new NebulaGalaxy({ ...SMALL, armStars: 800, coreStars: 0, dustStars: 0, backgroundStars: 0 })
    const centers = galaxy.stars.geometry.getAttribute('aCenter')

    for (let i = 0; i < galaxy.particleCount; i += 1) {
      const x = centers.getX(i * 4)
      const y = centers.getY(i * 4)

      expect(Math.hypot(x, y)).toBeLessThanOrEqual(5.15 + 0.1)
    }

    galaxy.dispose()
  })

  it('advances shader time and freezes it while paused', () => {
    const galaxy = new NebulaGalaxy(SMALL)

    galaxy.update(0.5)
    expect(galaxy.time).toBeCloseTo(0.5)
    expect(internals(galaxy).uTime.value).toBeCloseTo(0.5)

    galaxy.setPaused(true)
    galaxy.update(0.5)
    expect(galaxy.time).toBeCloseTo(0.5)

    galaxy.setSpeed(2)
    galaxy.setPaused(false)
    galaxy.update(0.25)
    expect(galaxy.time).toBeCloseTo(1)
    expect(galaxy.speed).toBe(2)

    galaxy.dispose()
  })

  it('runs a click wave from the core and fades it after its lifetime', () => {
    const galaxy = new NebulaGalaxy(SMALL)

    expect(galaxy.pulseAge).toBeGreaterThan(2.6)

    galaxy.pulse()
    expect(galaxy.pulseAge).toBe(0)
    expect(internals(galaxy).uPulse.value).toBe(0)

    galaxy.update(0.5)
    expect(galaxy.pulseAge).toBeCloseTo(0.5)

    galaxy.update(10)
    expect(galaxy.pulseAge).toBeCloseTo(2.6)

    galaxy.dispose()
  })

  it('blends towards the requested palette', () => {
    const galaxy = new NebulaGalaxy({ ...SMALL, autoRotate: false })
    const target = new THREE.Color(0xd6fff2)

    galaxy.setPalette('aurora')
    galaxy.update(10)

    expect(galaxy.palette).toBe('aurora')
    const uniform = internals(galaxy).uCoreColor.value
    expect(uniform.r).toBeCloseTo(target.r, 6)
    expect(uniform.g).toBeCloseTo(target.g, 6)
    expect(uniform.b).toBeCloseTo(target.b, 6)

    galaxy.dispose()
  })

  it('tilts the disc when the pointer drags across the canvas', () => {
    const galaxy = new NebulaGalaxy({ ...SMALL, autoRotate: false })
    const { canvas } = attachToScene(galaxy)

    dispatchPointer(canvas, 'pointerdown', 0, 0)
    dispatchPointer(window, 'pointermove', 120, 40)
    galaxy.update(1)

    expect(galaxy.tilt.y).toBeGreaterThan(0)
    expect(galaxy.tilt.x).toBeGreaterThan(0)
    expect(galaxy.galaxy.rotation.y).toBeCloseTo(galaxy.tilt.y)

    dispatchPointer(window, 'pointerup', 120, 40)
    expect(galaxy.pulseAge).toBeGreaterThan(2.6)

    galaxy.dispose()
  })

  it('sends a wave on a tap that did not travel', () => {
    const galaxy = new NebulaGalaxy({ ...SMALL, autoRotate: false })
    const { canvas } = attachToScene(galaxy)

    dispatchPointer(canvas, 'pointerdown', 10, 10)
    dispatchPointer(window, 'pointerup', 12, 11)

    expect(galaxy.pulseAge).toBe(0)

    galaxy.dispose()
  })

  it('zooms the disc with the wheel within the configured bounds', () => {
    const galaxy = new NebulaGalaxy({ ...SMALL, autoRotate: false, maxZoom: 1.3 })
    const { canvas } = attachToScene(galaxy)

    const wheel = new Event('wheel', { cancelable: true }) as WheelEvent
    Object.defineProperty(wheel, 'deltaY', { value: -400 })
    canvas.dispatchEvent(wheel)
    galaxy.update(10)

    expect(galaxy.zoom).toBeCloseTo(1.3)

    galaxy.dispose()
  })

  it('pre-corrects uniform colours on the WebGPU path', () => {
    const galaxy = new NebulaGalaxy(SMALL)
    const base = new THREE.Color(0xffe0a8)

    attachToScene(galaxy, true)

    const uniform = internals(galaxy).uCoreColor.value
    expect(uniform.r).toBeCloseTo(Math.pow(base.r, 2.2) * 0.86, 6)
    expect(uniform.g).toBeCloseTo(Math.pow(base.g, 2.2) * 0.86, 6)
    expect(uniform.b).toBeCloseTo(Math.pow(base.b, 2.2) * 0.86, 6)
    expect(internals(galaxy).uPixelRatio.value).toBe(1)

    galaxy.dispose()
  })

  it('respects reduced motion by disabling idle rotation and the click wave', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    const galaxy = new NebulaGalaxy(SMALL)
    const { canvas } = attachToScene(galaxy)

    galaxy.update(1)
    expect(galaxy.tilt.y).toBe(0)

    dispatchPointer(canvas, 'pointerdown', 10, 10)
    dispatchPointer(window, 'pointerup', 10, 10)
    expect(galaxy.pulseAge).toBeGreaterThan(2.6)

    galaxy.dispose()
  })

  it('releases the frame loop, geometries and materials on dispose', () => {
    const galaxy = new NebulaGalaxy(SMALL)
    attachToScene(galaxy)

    const geometries = [
      galaxy.stars.geometry,
      galaxy.background.geometry,
      galaxy.haze.geometry,
      galaxy.ring.geometry
    ]
    const materials = [
      galaxy.stars.material as THREE.Material,
      galaxy.background.material as THREE.Material,
      galaxy.haze.material as THREE.Material,
      galaxy.ring.material as THREE.Material
    ]
    const geometrySpies = geometries.map((geometry) => vi.spyOn(geometry, 'dispose'))
    const materialSpies = materials.map((material) => vi.spyOn(material, 'dispose'))

    galaxy.dispose()

    geometrySpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    materialSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    expect(internals(galaxy).animationId).toBeNull()
    expect(raf.cancel).toHaveBeenCalled()
    expect(galaxy.children).toHaveLength(0)

    galaxy.dispose()

    geometrySpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
    materialSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
  })
})
