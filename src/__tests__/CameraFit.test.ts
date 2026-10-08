import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import {
  fitCameraToBox,
  fitCameraToObject,
  fitCameraToGeoPoints,
  fitCameraToPoints,
  isGeoPoint
} from '../utils/CameraFit'
import { GeoReference } from '../crs/GeoReference'

function makeCamera(aspect = 2): THREE.PerspectiveCamera {
  return new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
}

function boxAt(min: [number, number, number], max: [number, number, number]): THREE.Box3 {
  return new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max))
}

describe('fitCameraToBox', () => {
  it('looks at the box centre', () => {
    const camera = makeCamera()
    const box = boxAt([10, 0, -5], [30, 10, 5])
    fitCameraToBox(camera, box)
    camera.updateMatrixWorld()

    const viewDir = new THREE.Vector3()
    camera.getWorldDirection(viewDir)
    const toCenter = new THREE.Vector3(20, 5, 0).sub(camera.position).normalize()
    expect(viewDir.dot(toCenter)).toBeCloseTo(1, 5)
  })

  it('places the camera at the requested elevation and azimuth', () => {
    const camera = makeCamera()
    fitCameraToBox(camera, boxAt([-50, 0, -50], [50, 0, 50]), {
      elevation: Math.PI / 2,
      azimuth: 0,
      padding: 1
    })
    expect(camera.position.x).toBeCloseTo(0, 6)
    expect(camera.position.z).toBeCloseTo(0, 6)
    expect(camera.position.y).toBeGreaterThan(0)
  })

  it('keeps the whole box within the frustum at the default elevation', () => {
    const camera = makeCamera()
    const box = boxAt([-200, 0, -200], [200, 120, 200])
    fitCameraToBox(camera, box)

    const corners = [
      new THREE.Vector3(-200, 0, -200),
      new THREE.Vector3(200, 0, -200),
      new THREE.Vector3(-200, 120, 200),
      new THREE.Vector3(200, 120, 200)
    ]
    for (const corner of corners) {
      const projected = corner.clone().project(camera)
      expect(projected.z).toBeLessThanOrEqual(1)
      expect(Math.abs(projected.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(projected.y)).toBeLessThanOrEqual(1)
    }
  })

  it('derives near/far from the content scale instead of fixed numbers', () => {
    const city = makeCamera()
    fitCameraToBox(city, boxAt([-400, 0, -400], [400, 120, 400]))
    expect(city.far).toBeGreaterThan(800)

    const particle = makeCamera()
    fitCameraToBox(particle, boxAt([-1, 0, -1], [1, 3, 1]))
    expect(particle.far).toBeLessThan(city.far / 10)
  })

  it('respects an explicit distance override', () => {
    const camera = makeCamera()
    fitCameraToBox(camera, boxAt([-10, 0, -10], [10, 10, 10]), { distance: 250 })
    const center = new THREE.Vector3(0, 5, 0)
    expect(camera.position.distanceTo(center)).toBeCloseTo(250, 5)
  })

  it('leaves an empty box untouched', () => {
    const camera = makeCamera()
    const before = camera.position.toArray()
    fitCameraToBox(camera, new THREE.Box3())
    expect(camera.position.toArray()).toEqual(before)
  })

  it('can keep the clipping planes unchanged', () => {
    const camera = makeCamera()
    fitCameraToBox(camera, boxAt([-400, 0, -400], [400, 120, 400]), { adjustClip: false })
    expect(camera.near).toBe(0.1)
    expect(camera.far).toBe(1000)
  })
})

describe('fitCameraToObject', () => {
  it('frames the bounding box of a single object', () => {
    const camera = makeCamera()
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20))
    mesh.position.set(0, 10, 0)
    fitCameraToObject(camera, mesh)
    expect(camera.position.length()).toBeGreaterThan(10)
  })

  it('frames the union of several objects', () => {
    const camera = makeCamera()
    const geometry = new THREE.BoxGeometry(10, 10, 10)
    const a = new THREE.Mesh(geometry)
    a.position.set(-100, 5, 0)
    const b = new THREE.Mesh(geometry)
    b.position.set(100, 5, 0)
    fitCameraToObject(camera, [a, b])
    expect(camera.position.distanceTo(new THREE.Vector3(0, 5, 0))).toBeGreaterThan(100)
  })
})

describe('fitCameraToGeoPoints', () => {
  const ORIGIN = { lng: 116.391, lat: 39.907 }
  const MARKERS = [
    { lng: 116.397428, lat: 39.90923 },
    { lng: 116.4005, lat: 39.9117 },
    { lng: 116.3945, lat: 39.912 }
  ]

  it('matches framing the equivalent local metre box', () => {
    const geo = new GeoReference(ORIGIN)
    const viaGeo = makeCamera()
    fitCameraToGeoPoints(viaGeo, MARKERS, geo)

    const box = new THREE.Box3()
    for (const point of MARKERS) box.expandByPoint(geo.toLocal(point))
    const viaBox = makeCamera()
    fitCameraToBox(viaBox, box)

    expect(viaGeo.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      viaBox.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('is a no-op for an empty point list', () => {
    const geo = new GeoReference(ORIGIN)
    const camera = makeCamera()
    const before = camera.position.toArray()
    fitCameraToGeoPoints(camera, [], geo)
    expect(camera.position.toArray()).toEqual(before)
  })

  it('syncs controls.target to the content centre when provided', () => {
    const geo = new GeoReference(ORIGIN)
    const camera = makeCamera()
    const update = vi.fn()
    const controls = {
      target: new THREE.Vector3(),
      update
    } as unknown as import('three-stdlib').OrbitControls
    fitCameraToGeoPoints(camera, MARKERS, geo, undefined, { controls })
    expect(update).toHaveBeenCalled()
    expect(controls.target.length()).toBeGreaterThan(0)
  })
})

describe('isGeoPoint', () => {
  it('recognises geographic points by shape', () => {
    expect(isGeoPoint({ lng: 116.4, lat: 39.9 })).toBe(true)
    expect(isGeoPoint({ lng: 116.4, lat: 39.9, alt: 10 })).toBe(true)
  })

  it('treats local metre points as non-geographic', () => {
    expect(isGeoPoint(new THREE.Vector3(1, 2, 3))).toBe(false)
    expect(isGeoPoint({ x: 1, y: 2, z: 3 })).toBe(false)
    expect(isGeoPoint({ x: 1, y: 2 })).toBe(false)
  })
})

describe('fitCameraToPoints', () => {
  const ORIGIN = { lng: 116.391, lat: 39.907 }
  const MARKERS = [
    { lng: 116.397428, lat: 39.90923 },
    { lng: 116.4005, lat: 39.9117 },
    { lng: 116.3945, lat: 39.912 }
  ]

  it('frames geographic points via options.geo like fitCameraToGeoPoints', () => {
    const geo = new GeoReference(ORIGIN)
    const unified = makeCamera()
    fitCameraToPoints(unified, MARKERS, { geo })

    const legacy = makeCamera()
    fitCameraToGeoPoints(legacy, MARKERS, geo)

    expect(unified.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      legacy.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('honours options.datum for geographic points', () => {
    const geo = new GeoReference(ORIGIN, { datum: 'WGS84' })
    const camera = makeCamera()
    expect(() => fitCameraToPoints(camera, MARKERS, { geo, datum: 'GCJ02' })).not.toThrow()
    expect(camera.position.length()).toBeGreaterThan(0)
  })

  it('frames local Vector3 points without any geo reference', () => {
    const camera = makeCamera()
    fitCameraToPoints(camera, [new THREE.Vector3(-100, 0, 0), new THREE.Vector3(100, 0, 0)])

    const box = boxAt([-100, 0, 0], [100, 0, 0])
    const expected = makeCamera()
    fitCameraToBox(expected, box)

    expect(camera.position.toArray().map((n) => Math.round(n * 1e6))).toEqual(
      expected.position.toArray().map((n) => Math.round(n * 1e6))
    )
  })

  it('frames plain {x, y, z} local points, defaulting z to zero', () => {
    const camera = makeCamera()
    fitCameraToPoints(camera, [
      { x: -50, y: 0 },
      { x: 50, y: 10 }
    ])
    expect(camera.position.length()).toBeGreaterThan(0)
  })

  it('throws when geographic points are given without a geo reference', () => {
    const camera = makeCamera()
    expect(() => fitCameraToPoints(camera, MARKERS)).toThrow(/options\.geo is required/)
  })

  it('rejects mixing geographic and local points', () => {
    const geo = new GeoReference(ORIGIN)
    const camera = makeCamera()
    expect(() =>
      fitCameraToPoints(camera, [MARKERS[0], new THREE.Vector3(0, 0, 0)], { geo })
    ).toThrow(/cannot mix/)
    expect(() =>
      fitCameraToPoints(camera, [new THREE.Vector3(0, 0, 0), MARKERS[0]], { geo })
    ).toThrow(/cannot mix/)
  })

  it('is a no-op for an empty point list', () => {
    const camera = makeCamera()
    const before = camera.position.toArray()
    fitCameraToPoints(camera, [])
    expect(camera.position.toArray()).toEqual(before)
  })
})
