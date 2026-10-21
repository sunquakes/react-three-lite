import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import type { OrbitControls } from 'three-stdlib'
import { FitCamera } from '../utils/FitCamera'
import { fitCameraToBox, fitCameraToPoints } from '../utils/CameraFit'
import { GeoReference } from '../crs/GeoReference'
import { bindSceneGeo } from '../crs/SceneGeo'

const ORIGIN = { lng: 116.391, lat: 39.907 }
const MARKERS = [
  { lng: 116.397428, lat: 39.90923 },
  { lng: 116.4005, lat: 39.9117 },
  { lng: 116.3945, lat: 39.912 }
]

function plainCamera(aspect = 1): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
}

function boxAt(min: [number, number, number], max: [number, number, number]): THREE.Box3 {
  return new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max))
}

function mockControls(): { controls: OrbitControls; update: ReturnType<typeof vi.fn> } {
  const update = vi.fn()
  const controls = {
    target: new THREE.Vector3(),
    update
  } as unknown as OrbitControls
  return { controls, update }
}

describe('FitCamera construction', () => {
  it('is a drop-in THREE.PerspectiveCamera', () => {
    const camera = new FitCamera()
    expect(camera).toBeInstanceOf(FitCamera)
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera)
    expect(camera.isPerspectiveCamera).toBe(true)
  })

  it('uses the same constructor defaults as the scene camera factory', () => {
    const camera = new FitCamera()
    expect(camera.fov).toBe(75)
    expect(camera.aspect).toBe(1)
    expect(camera.near).toBe(0.1)
    expect(camera.far).toBe(1000)
    expect(camera.position.toArray()).toEqual([0, 0, 1])
  })

  it('keeps a plain native THREE.Vector3 position', () => {
    const camera = new FitCamera()
    expect(camera.position).toBeInstanceOf(THREE.Vector3)
    expect(Object.getPrototypeOf(camera.position)).toBe(THREE.Vector3.prototype)
  })

  it('accepts custom perspective parameters', () => {
    const camera = new FitCamera(50, 1.6, 1, 500)
    expect(camera.fov).toBe(50)
    expect(camera.aspect).toBe(1.6)
    expect(camera.near).toBe(1)
    expect(camera.far).toBe(500)
  })
})

describe('FitCamera positioning', () => {
  function geoScene(geo: GeoReference): THREE.Scene {
    return bindSceneGeo(new THREE.Scene(), geo)
  }

  it('keeps position.set as plain local metres', () => {
    const camera = new FitCamera().bind(new GeoReference(ORIGIN))
    expect(camera.position.set(10, -5, 20)).toBe(camera.position)
    expect(camera.position.toArray()).toEqual([10, -5, 20])
  })

  it('places a camera through scene.setPosition using the scene reference', () => {
    const geo = new GeoReference(ORIGIN)
    const scene = geoScene(geo)
    const camera = new FitCamera()

    expect(scene.setPosition(camera, { lng: 116.397428, lat: 39.90923, alt: 120 })).toBe(camera)

    const expected = geo.toLocal({ lng: 116.397428, lat: 39.90923, alt: 120 })
    expect(camera.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('places a camera exactly like a mesh through the same scene call', () => {
    const scene = geoScene(new GeoReference(ORIGIN))
    const camera = new FitCamera()
    const mesh = new THREE.Object3D()

    scene.setPosition(camera, { lng: 116.397428, lat: 39.90923, alt: 0 })
    scene.setPosition(mesh, { lng: 116.397428, lat: 39.90923, alt: 0 })

    expect(camera.position.toArray()).toEqual(mesh.position.toArray())
  })

  it('maps the local origin to (0, 0, 0) via scene.setPosition', () => {
    const scene = geoScene(new GeoReference(ORIGIN))
    const camera = new FitCamera()
    scene.setPosition(camera, { lng: ORIGIN.lng, lat: ORIGIN.lat })
    expect(camera.position.toArray().map((n) => Math.round(n * 1e6))).toEqual([0, 0, 0])
  })

  it('projects longitude/latitude through an explicit datum', () => {
    const geo = new GeoReference(ORIGIN, { datum: 'GCJ02' })
    const scene = geoScene(geo)
    const camera = new FitCamera()
    scene.setPosition(camera, { lng: 116.397428, lat: 39.90923 }, 'GCJ02')

    const expected = geo.toLocal({ lng: 116.397428, lat: 39.90923 }, 'GCJ02')
    expect(camera.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.toArray().map((n) => Math.round(n * 1e6))
    )
  })
})

describe('FitCamera.bind', () => {
  it('stores the geo reference and controls for later calls', () => {
    const geo = new GeoReference(ORIGIN)
    const { controls } = mockControls()
    const camera = new FitCamera().bind(geo, controls)
    expect(camera.geo).toBe(geo)
    expect(camera.controls).toBe(controls)
  })

  it('returns the camera instance for inline chaining', () => {
    const camera = new FitCamera()
    expect(camera.bind(new GeoReference(ORIGIN))).toBe(camera)
  })

  it('starts with a null controls binding', () => {
    expect(new FitCamera().controls).toBeNull()
  })

  it('only updates the arguments that are actually passed', () => {
    const geo = new GeoReference(ORIGIN)
    const { controls } = mockControls()
    const camera = new FitCamera().bind(geo, controls)

    camera.bind(undefined)
    expect(camera.geo).toBe(geo)
    expect(camera.controls).toBe(controls)

    camera.bind(undefined, null)
    expect(camera.controls).toBeNull()
    expect(camera.geo).toBe(geo)

    camera.bind(null)
    expect(camera.geo).toBeUndefined()
    expect(camera.controls).toBeNull()
  })
})

describe('FitCamera.fitToPoints', () => {
  it('frames bound geographic points identically to the pure function', () => {
    const geo = new GeoReference(ORIGIN)
    const fit = new FitCamera().bind(geo)
    fit.fitToPoints(MARKERS)

    const expected = plainCamera()
    fitCameraToPoints(expected, MARKERS, { geo })

    expect(fit.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('frames local metre points without any bound geo reference', () => {
    const fit = new FitCamera()
    fit.fitToPoints([new THREE.Vector3(-100, 0, 0), new THREE.Vector3(100, 10, 0)])

    const expected = plainCamera()
    fitCameraToBox(expected, boxAt([-100, 0, 0], [100, 10, 0]))

    expect(fit.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('lets a per-call geo win over the bound reference', () => {
    const bound = new GeoReference({ lng: 0, lat: 0 })
    const perCall = new GeoReference(ORIGIN)
    const fit = new FitCamera().bind(bound)
    expect(() => fit.fitToPoints(MARKERS, { geo: perCall })).not.toThrow()

    const expected = plainCamera()
    fitCameraToPoints(expected, MARKERS, { geo: perCall })
    expect(fit.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('throws for geographic points when no geo is bound or passed', () => {
    const camera = new FitCamera()
    expect(() => camera.fitToPoints(MARKERS)).toThrow(/options\.geo is required/)
  })

  it('rejects mixing geographic and local points', () => {
    const geo = new GeoReference(ORIGIN)
    const camera = new FitCamera().bind(geo)
    expect(() => camera.fitToPoints([MARKERS[0], new THREE.Vector3(0, 0, 0)])).toThrow(/cannot mix/)
  })

  it('is a no-op for an empty point list', () => {
    const camera = new FitCamera().bind(new GeoReference(ORIGIN))
    const before = camera.position.toArray()
    expect(camera.fitToPoints([])).toBe(camera)
    expect(camera.position.toArray()).toEqual(before)
  })

  it('returns the camera instance for chaining', () => {
    const camera = new FitCamera()
    expect(
      camera.fitToPoints([
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ])
    ).toBe(camera)
  })
})

describe('FitCamera framing with bound controls', () => {
  it('syncs the bound controls target to the content centre', () => {
    const { controls, update } = mockControls()
    const camera = new FitCamera().bind(new GeoReference(ORIGIN), controls)
    camera.fitToPoints(MARKERS)
    expect(update).toHaveBeenCalled()
    expect(controls.target.length()).toBeGreaterThan(0)
  })

  it('lets per-call controls override the bound ones', () => {
    const bound = mockControls()
    const perCall = mockControls()
    const camera = new FitCamera().bind(new GeoReference(ORIGIN), bound.controls)
    camera.fitToPoints(MARKERS, { controls: perCall.controls })
    expect(bound.update).not.toHaveBeenCalled()
    expect(perCall.update).toHaveBeenCalled()
  })
})

describe('FitCamera.fitToObject', () => {
  it('frames the bounding box of a single object', () => {
    const camera = new FitCamera()
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20))
    mesh.position.set(0, 10, 0)
    expect(camera.fitToObject(mesh)).toBe(camera)
    expect(camera.position.length()).toBeGreaterThan(10)
  })

  it('frames the union of several objects and equals the pure function', () => {
    const geometry = new THREE.BoxGeometry(10, 10, 10)
    const a = new THREE.Mesh(geometry)
    a.position.set(-100, 5, 0)
    const b = new THREE.Mesh(geometry)
    b.position.set(100, 5, 0)

    const fit = new FitCamera()
    fit.fitToObject([a, b])

    const expected = plainCamera()
    const box = new THREE.Box3()
    box.expandByObject(a).expandByObject(b)
    fitCameraToBox(expected, box)

    expect(fit.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })
})

describe('FitCamera.fitToBox', () => {
  it('frames an explicit local box identically to the pure function', () => {
    const box = boxAt([-200, 0, -200], [200, 120, 200])
    const fit = new FitCamera()
    expect(fit.fitToBox(box)).toBe(fit)

    const expected = plainCamera()
    fitCameraToBox(expected, box)

    expect(fit.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('syncs bound controls while fitting a box', () => {
    const { controls, update } = mockControls()
    const camera = new FitCamera()
    camera.controls = controls
    camera.fitToBox(boxAt([-10, 0, -10], [10, 10, 10]))
    expect(update).toHaveBeenCalled()
    expect(controls.target).toEqual(new THREE.Vector3(0, 5, 0))
  })
})
