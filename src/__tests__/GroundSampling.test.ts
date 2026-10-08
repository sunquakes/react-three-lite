import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { MAX_GROUND_RANGE_FACTOR, sampleVisibleGround } from '../utils/GroundSampling'

const GROUND_Y = 0

/** Camera at (0, height, distance) looking at the world origin, so its view
 * axis has a depression angle of atan(height / distance). */
function makeCamera(height: number, distance: number, far = 4000): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(75, 2, 0.1, far)
  camera.position.set(0, height, distance)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  return camera
}

const horizontalDistance = (camera: THREE.PerspectiveCamera, point: THREE.Vector3): number =>
  Math.hypot(point.x - camera.position.x, point.z - camera.position.z)

describe('sampleVisibleGround', () => {
  it('covers both the ground behind and ahead of a steep 57-degree view', () => {
    // Depression ~57 degrees with a 75-degree fov: the bottom frustum edge
    // passes 4.7 degrees past the zenith, so its corner rays still meet the
    // ground but behind the camera (~857 m back) - the bottom band of the
    // frame shows ground behind the viewer. The coverage rectangle must span
    // that near band, the look-at point, and the distant upper corners.
    const camera = makeCamera(700, 450)
    const samples = sampleVisibleGround(camera, GROUND_Y)
    const distances = samples.map((point) => horizontalDistance(camera, point))

    expect(samples).toHaveLength(5)
    // Near field: the view-centre probe lands on the look-at point.
    expect(Math.min(...distances)).toBeLessThan(500)
    // Far field: the upper corners reach the distant ground, within the cap.
    expect(Math.max(...distances)).toBeGreaterThan(3000)
    expect(Math.max(...distances)).toBeLessThanOrEqual(700 * MAX_GROUND_RANGE_FACTOR)
    // The bounding rectangle spans ground behind the camera (z ~ +508) and
    // far ahead of it (z ~ -1498).
    const minZ = Math.min(...samples.map((point) => point.z))
    const maxZ = Math.max(...samples.map((point) => point.z))
    expect(minZ).toBeLessThan(-1400)
    expect(maxZ).toBeGreaterThan(450)
    samples.forEach((point) => expect(point.y).toBeCloseTo(GROUND_Y, 5))
  })

  it('covers the full ground band of a 45-degree view, clamping far corners to the range cap', () => {
    // Depression 45 degrees: every corner ray meets the ground ahead of the
    // camera. The upper corners land beyond the cap of 6 * 450 = 2700 m and
    // are clamped along their bearing; the lower corners land ~556 m ahead.
    const camera = makeCamera(450, 450)
    const samples = sampleVisibleGround(camera, GROUND_Y)
    const distances = samples.map((point) => horizontalDistance(camera, point))

    expect(Math.min(...distances)).toBeLessThan(600)
    expect(Math.max(...distances)).toBeGreaterThan(2600)
    expect(Math.max(...distances)).toBeLessThanOrEqual(2700 + 1)
    // The bounding rectangle spans the whole view band, near edge to clamped
    // far edge, entirely on the northern side of the camera.
    const minZ = Math.min(...samples.map((point) => point.z))
    const maxZ = Math.max(...samples.map((point) => point.z))
    expect(minZ).toBeLessThan(-1200)
    expect(maxZ).toBeGreaterThan(380)
    expect(maxZ).toBeLessThan(450)
  })

  it('keeps the look-at point covered when a shallow tilt lifts corners above the horizon', () => {
    // Depression 15 degrees (the maxPolarAngle limit tilted back): the top
    // frustum edge points above the horizon. Skyward corners collapse to the
    // camera's ground position while the centre ray still reaches the look-at
    // point ~2614 m ahead, so the visible middle ground stays covered.
    const camera = makeCamera(700, 2614)
    const samples = sampleVisibleGround(camera, GROUND_Y)
    const distances = samples.map((point) => horizontalDistance(camera, point))

    expect(Math.min(...distances)).toBeLessThan(50)
    expect(Math.max(...distances)).toBeGreaterThan(2600)
    expect(Math.max(...distances)).toBeLessThanOrEqual(700 * MAX_GROUND_RANGE_FACTOR)
    // The look-at point itself is inside the sampled bounding box.
    const minX = Math.min(...samples.map((point) => point.x))
    const maxX = Math.max(...samples.map((point) => point.x))
    const minZ = Math.min(...samples.map((point) => point.z))
    const maxZ = Math.max(...samples.map((point) => point.z))
    expect(minX).toBeLessThanOrEqual(0)
    expect(maxX).toBeGreaterThanOrEqual(0)
    expect(minZ).toBeLessThanOrEqual(0)
    expect(maxZ).toBeGreaterThanOrEqual(0)
  })

  it('surrounds the ground below a top-down camera', () => {
    // Straight down: the default up vector is parallel to the view axis, so
    // point the camera up along -z before lookAt to keep the basis valid.
    const camera = new THREE.PerspectiveCamera(75, 2, 0.1, 4000)
    camera.position.set(0, 100, 0)
    camera.up.set(0, 0, -1)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const samples = sampleVisibleGround(camera, GROUND_Y)

    expect(samples).toHaveLength(5)
    const minX = Math.min(...samples.map((point) => point.x))
    const maxX = Math.max(...samples.map((point) => point.x))
    const minZ = Math.min(...samples.map((point) => point.z))
    const maxZ = Math.max(...samples.map((point) => point.z))
    expect(minX).toBeLessThan(0)
    expect(maxX).toBeGreaterThan(0)
    expect(minZ).toBeLessThan(0)
    expect(maxZ).toBeGreaterThan(0)
    samples.forEach((point) => {
      expect(point.y).toBeCloseTo(GROUND_Y, 5)
      expect(horizontalDistance(camera, point)).toBeLessThan(600)
    })
  })
})
