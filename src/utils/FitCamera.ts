import * as THREE from 'three'
import type { OrbitControls } from 'three-stdlib'
import type { GeoReference } from '../crs/GeoReference'
import type { DatumType } from '../crs/types'
import { fitCameraToBox, fitCameraToObject, fitCameraToPoints } from './CameraFit'
import type { CameraFitOptions, FitPoint } from './CameraFit'

/**
 * Options for framing with a {@link FitCamera}. The camera instance may carry a
 * bound `geo`/`controls`, so every reference-related field stays optional here;
 * a value passed per call always wins over the bound one.
 */
export interface FitCameraOptions extends CameraFitOptions {
  geo?: GeoReference
  datum?: DatumType
}

/**
 * A perspective camera with scene-framing helpers. It is a drop-in
 * `THREE.PerspectiveCamera` (same constructor parameters, a plain native
 * `position`, and the Scene's resize/controls code keeps working unchanged).
 * Positioning stays coordinate-system agnostic: place it exactly like any other
 * object via the scene's own helper, e.g. `scene.setPosition(camera, { lng, lat,
 * alt })` — the same call that anchors a mesh — or move it in local metres with
 * the normal `position.set(x, y, z)`.
 *
 * Bind the scene's GeoReference and `OrbitControls` with {@link FitCamera.bind}
 * so the `fitTo*` framing helpers run without re-threading those references
 * into every call. Pass an instance to `<Scene camera={...} />` and bind it
 * inside `onCreated`, or construct one directly.
 */
export class FitCamera extends THREE.PerspectiveCamera {
  /** Reference used to interpret geographic points passed to fitToPoints. */
  geo?: GeoReference
  /** Controls whose target is synced by the framing helpers. */
  controls: OrbitControls | null = null

  constructor(fov = 75, aspect = 1, near = 0.1, far = 1000) {
    super(fov, aspect, near, far)
    this.position.set(0, 0, 1)
  }

  /**
   * Bind (or rebind) the geographic reference and controls used by later framing
   * calls. Only the arguments actually passed are updated, so the two can be
   * bound independently; pass `null` explicitly to clear a binding.
   */
  bind(geo?: GeoReference | null, controls?: OrbitControls | null): this {
    if (geo !== undefined) this.geo = geo ?? undefined
    if (controls !== undefined) this.controls = controls
    return this
  }

  /**
   * Frame a set of points; each point is either a geographic `{lng, lat}` point
   * (projected through the bound/per-call geo) or a local metre
   * `THREE.Vector3` / `{x, y, z}`.
   */
  fitToPoints(points: FitPoint[], options: FitCameraOptions = {}): this {
    const { geo = this.geo, datum, controls, ...fitOptions } = options
    fitCameraToPoints(this, points, {
      ...fitOptions,
      controls: controls ?? this.controls,
      ...(geo !== undefined ? { geo } : {}),
      ...(datum !== undefined ? { datum } : {})
    })
    return this
  }

  /** Frame the world-space bounding box of one or more objects. */
  fitToObject(object: THREE.Object3D | THREE.Object3D[], options: CameraFitOptions = {}): this {
    fitCameraToObject(this, object, {
      ...options,
      controls: options.controls ?? this.controls
    })
    return this
  }

  /** Frame an explicit axis-aligned box already expressed in local metres. */
  fitToBox(box: THREE.Box3, options: CameraFitOptions = {}): this {
    fitCameraToBox(this, box, {
      ...options,
      controls: options.controls ?? this.controls
    })
    return this
  }
}
