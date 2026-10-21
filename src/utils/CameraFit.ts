import * as THREE from 'three'
import type { OrbitControls } from 'three-stdlib'
import type { GeoReference } from '../crs/GeoReference'
import type { DatumType, GeoPoint } from '../crs/types'
export interface CameraFitOptions {
  /**
   * Viewing elevation above the horizontal plane in radians. 0 is a horizontal
   * view, PI/2 is top-down. Defaults to ~45deg, which keeps a ground plane from
   * occluding the markers.
   */
  elevation?: number
  /**
   * Horizontal bearing of the camera around the target in radians, measured
   * clockwise from north (-Z) like a GIS compass bearing. Defaults to PI/4.
   */
  azimuth?: number
  /** Multiplier applied to the computed distance; >1 zooms out for margin. */
  padding?: number
  /** Override the computed distance (in local metres). */
  distance?: number
  /** When true (default), derive near/far planes from the content scale. */
  adjustClip?: boolean
  /** OrbitControls target is synced to the box centre when supplied. */
  controls?: OrbitControls | null
}

/**
 * A position already expressed in the local three.js metre frame. Both
 * THREE.Vector3 and a plain {x, y, z} object are accepted.
 */
export type LocalPoint = THREE.Vector3 | { x: number; y: number; z?: number }

/** Geographic or local point accepted by the unified framing entry point. */
export type FitPoint = GeoPoint | LocalPoint

/**
 * Options for {@link fitCameraToPoints}. A geographic reference is required
 * only when the input contains geographic points; it is ignored for points
 * that are already in local metres.
 */
export interface FitPointsOptions extends CameraFitOptions {
  /**
   * GeoReference used to project geographic points to local metres. The scene
   * always exposes one through onCreated/useScene, even for non-GIS scenes.
   */
  geo?: GeoReference
  /** Datum of geographic inputs. Defaults to the GeoReference's own datum. */
  datum?: DatumType
}

const DEFAULT_ELEVATION = Math.PI / 4
const DEFAULT_AZIMUTH = Math.PI / 4
const DEFAULT_PADDING = 1.4

/**
 * Frame a perspective camera on an axis-aligned box expressed in the same local
 * metre space three.js renders in. Distance, position and (optionally) the near
 * and far clipping planes are derived from the box, so callers never hard-code
 * a far plane or a viewpoint that belongs to a specific data scale.
 *
 * Because every CRS/datum is already normalised to local metres by
 * GeoReference.toLocal, this routine is reference-system agnostic.
 */
export function fitCameraToBox(
  camera: THREE.PerspectiveCamera,
  box: THREE.Box3,
  options: CameraFitOptions = {}
): THREE.PerspectiveCamera {
  const {
    elevation = DEFAULT_ELEVATION,
    azimuth = DEFAULT_AZIMUTH,
    padding = DEFAULT_PADDING,
    distance: distanceOverride,
    adjustClip = true,
    controls = null
  } = options

  if (box.isEmpty()) return camera

  const center = box.getCenter(new THREE.Vector3())

  const fitDistance =
    distanceOverride ?? computeFitDistance(camera, box, center, elevation, azimuth) * padding

  placeCamera(camera, center, fitDistance, elevation, azimuth)

  if (adjustClip) {
    // Keep the near/far ratio bounded so depth precision is not wasted. The far
    // plane only has to cover the view distance plus the content radius, not a
    // fixed large number, so city-scale and particle-scale scenes both fit.
    const radius = box.getBoundingSphere(new THREE.Sphere()).radius
    camera.near = THREE.MathUtils.clamp(fitDistance / 1000, 0.05, 10)
    camera.far = (fitDistance + radius) * 4
    camera.updateProjectionMatrix()
  }

  if (controls) {
    controls.target.copy(center)
    controls.update()
  }

  // lookAt only updates the orientation quaternion; sync the world matrix so a
  // caller projecting points right after fitting reads the new transform.
  camera.updateMatrixWorld()

  return camera
}

/**
 * Frame a camera on the world-space bounding box of one or more objects.
 */
export function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D | THREE.Object3D[],
  options: CameraFitOptions = {}
): THREE.PerspectiveCamera {
  const box = new THREE.Box3()
  const objects = Array.isArray(object) ? object : [object]
  for (const item of objects) box.expandByObject(item)
  return fitCameraToBox(camera, box, options)
}

/**
 * Runtime discriminator between geographic and local positions. A point is
 * geographic when it carries longitude/latitude fields; anything with x/y is
 * already in the local three.js metre frame. The two shapes never overlap, so
 * no coordinate-value sniffing is needed.
 */
export function isGeoPoint(point: FitPoint): point is GeoPoint {
  return (
    point !== null &&
    typeof point === 'object' &&
    typeof (point as GeoPoint).lng === 'number' &&
    typeof (point as GeoPoint).lat === 'number'
  )
}

/**
 * Unified framing entry point. Each point may be either a geographic
 * `{lng, lat}` coordinate or a local metre position (`THREE.Vector3` /
 * `{x, y, z}`); the kind is detected per point via {@link isGeoPoint}, so a
 * caller never has to pick between a GIS and a non-GIS routine. Geographic
 * points are projected through `options.geo` (honouring `options.datum`),
 * while local points are used as-is, and both then share the same box fitting.
 * Mixing the two kinds in one call is rejected because it is almost always a
 * caller mistake; frame them separately instead.
 */
export function fitCameraToPoints(
  camera: THREE.PerspectiveCamera,
  points: FitPoint[],
  options: FitPointsOptions = {}
): THREE.PerspectiveCamera {
  if (points.length === 0) return camera

  const { geo, datum, ...fitOptions } = options
  const box = new THREE.Box3()
  const local = new THREE.Vector3()

  let kind: 'geo' | 'local' | null = null
  for (const point of points) {
    if (isGeoPoint(point)) {
      if (!geo) {
        throw new Error(
          'fitCameraToPoints: options.geo is required when framing geographic {lng, lat} points'
        )
      }
      if (kind === 'local') {
        throw new Error(
          'fitCameraToPoints: cannot mix geographic {lng, lat} points with local {x, y, z} points'
        )
      }
      kind = 'geo'
      geo.toLocal(point, datum, local)
      box.expandByPoint(local)
    } else {
      if (kind === 'geo') {
        throw new Error(
          'fitCameraToPoints: cannot mix geographic {lng, lat} points with local {x, y, z} points'
        )
      }
      kind = 'local'
      local.set(point.x, point.y, (point as { z?: number }).z ?? 0)
      box.expandByPoint(local)
    }
  }

  return fitCameraToBox(camera, box, fitOptions)
}

/**
 * Frame a camera on a set of geographic points. Coordinates are projected to
 * local metres through the scene's GeoReference, which makes this usable inside
 * onCreated before any <GeoObject> children have mounted.
 *
 * Retained as a thin, backward-compatible wrapper; new code can use the
 * coordinate-agnostic {@link fitCameraToPoints} instead.
 */
export function fitCameraToGeoPoints(
  camera: THREE.PerspectiveCamera,
  points: GeoPoint[],
  geo: GeoReference,
  datum?: DatumType,
  options: CameraFitOptions = {}
): THREE.PerspectiveCamera {
  return fitCameraToPoints(camera, points, { ...options, geo, datum })
}

/**
 * Build the camera basis for a spherical viewpoint. `camDir` points from the
 * target toward the camera (its Y component is +sin(elevation), so the camera
 * is always above the ground), `forward = -camDir` points from the camera
 * toward the target, and the camera itself sits at target + camDir*distance.
 * Azimuth is measured clockwise around +Y from north (-Z), the conventional
 * GIS bearing, and elevation is the angle above the ground plane. Both the fit
 * distance and the placement derive from this same basis so they can never
 * disagree.
 */
function cameraBasis(
  elevation: number,
  azimuth: number
): {
  camDir: THREE.Vector3
  forward: THREE.Vector3
  right: THREE.Vector3
  up: THREE.Vector3
} {
  const cosE = Math.cos(elevation)
  const camDir = new THREE.Vector3(
    cosE * Math.sin(azimuth),
    Math.sin(elevation),
    -cosE * Math.cos(azimuth)
  ).normalize()
  const forward = camDir.clone().negate()
  const worldUp = new THREE.Vector3(0, 1, 0)
  // At elevation PI/2 camDir is parallel to worldUp and the cross product
  // degenerates; keep the azimuth meaningful as an image roll instead.
  const right =
    cosE > 1e-6
      ? new THREE.Vector3().crossVectors(forward, worldUp).normalize()
      : new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth))
  const up = new THREE.Vector3().crossVectors(right, forward).normalize()
  return { camDir, forward, right, up }
}

/**
 * Distance needed to keep every box corner inside the frustum. Each corner is
 * expressed in the camera basis; its projected half-size must fit the horizontal
 * and vertical field of view at the corner's own depth, which also accounts for
 * corners that sit nearer to the camera than the target plane.
 */
function computeFitDistance(
  camera: THREE.PerspectiveCamera,
  box: THREE.Box3,
  center: THREE.Vector3,
  elevation: number,
  azimuth: number
): number {
  const vFov = THREE.MathUtils.degToRad(camera.fov)
  const aspect = camera.aspect > 0 ? camera.aspect : 1
  const tanV = Math.tan(vFov / 2)
  const tanH = Math.tan(vFov / 2) * aspect

  const { camDir, right, up } = cameraBasis(elevation, azimuth)
  const corner = new THREE.Vector3()
  let distance = 0

  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 0; iy < 2; iy++) {
      for (let iz = 0; iz < 2; iz++) {
        corner.set(
          ix ? box.max.x : box.min.x,
          iy ? box.max.y : box.min.y,
          iz ? box.max.z : box.min.z
        )
        corner.sub(center)
        // Depth of the corner along the target -> camera axis. A corner nearer
        // the camera contributes a smaller required distance, a farther corner
        // a larger one, so the maximum over all corners always encloses the box.
        const depth = corner.dot(camDir)
        const sx = Math.abs(corner.dot(right))
        const sy = Math.abs(corner.dot(up))
        distance = Math.max(distance, depth + sx / tanH, depth + sy / tanV)
      }
    }
  }

  return distance
}

function placeCamera(
  camera: THREE.PerspectiveCamera,
  target: THREE.Vector3,
  distance: number,
  elevation: number,
  azimuth: number
): void {
  const { camDir } = cameraBasis(elevation, azimuth)
  camera.position.copy(target).addScaledVector(camDir, distance)
  camera.lookAt(target)
}
