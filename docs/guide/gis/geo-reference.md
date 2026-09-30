---
id: geo-reference
lang: en-US
title: Geographic Reference
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoReference'

## Type

Class + Scene props

## Concept

`GeoReference` binds a coordinate reference system, a geodetic datum and an
axis convention to a fixed **local origin**. The conversion pipeline is:

```text
geographic (lng, lat, alt)
  -> datum normalize to WGS84
  -> local tangent plane (float64 metres)
  -> recenter around the local origin
  -> ENU -> three.js axis mapping (East:+X, North:-Z, Up:+Y)
  -> THREE.Vector3 (float32)
```

The local origin is what keeps scene coordinates small. Absolute Web Mercator
coordinates are around 1.3e7 metres, which would jitter badly in three.js
float32 positions at city scale; after recentering, every object sits within a
few kilometres of `(0, 0, 0)`.

A `GeoReference` always exists on a Scene. When no GIS props are supplied it
uses the WGS84/equirectangular defaults centred at `(0, 0)`, which is a no-op
for ordinary non-geographic scenes, so this feature is fully opt-in.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the
**WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <App />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    const ORIGIN: GeoPoint = { lng: 116.397, lat: 39.909 }
    const PLACES: { point: GeoPoint; color: number }[] = [
      { point: ORIGIN, color: 0xffd166 },
      { point: { lng: 116.4005, lat: 39.909 }, color: 0x4fc3f7 },
      { point: { lng: 116.397, lat: 39.9117 }, color: 0x81c784 },
      { point: { lng: 116.3935, lat: 39.9063 }, color: 0xe57373 }
    ]

    function App() {
      const objectsRef = useRef<THREE.Object3D[]>([])

      // The built-in grid is 20 m by default; a city-scale scene customises
      // it through gridHelper options, and Scene owns its disposal.
      const grid = {
        size: 1200,
        divisions: 24,
        colorCenterLine: 0x4a6fa5,
        colorGrid: 0x2f3e5c
      }

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A raised south-side viewpoint looks north over the landmarks; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 500, z: 700 })
        camera.lookAt(0, 0, 0)

        PLACES.forEach(({ point, color }) => {
          const radius = 35
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 16),
            new THREE.MeshBasicMaterial({ color })
          )
          // The scene carries its own GeoReference and projects the point itself.
          scene.setPosition(marker, point)
          // Rest the sphere on the ground plane instead of burying its lower half.
          marker.position.y = radius
          scene.add(marker)
          objectsRef.current.push(marker)
        })
      }

      useEffect(() => {
        return () => {
          objectsRef.current.forEach((object) => {
            object.removeFromParent()
            const mesh = object as THREE.Mesh
            mesh.geometry?.dispose()
            ;(mesh.material as THREE.Material | undefined)?.dispose()
          })
          objectsRef.current = []
        }
      }, [])

      return (
        <Scene
          origin={ORIGIN}
          gridHelper={grid}
          onCreated={handleCreated}
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```

  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <App rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    const ORIGIN: GeoPoint = { lng: 116.397, lat: 39.909 }
    const PLACES: { point: GeoPoint; color: number }[] = [
      { point: ORIGIN, color: 0xffd166 },
      { point: { lng: 116.4005, lat: 39.909 }, color: 0x4fc3f7 }
    ]

    function App() {
      const objectsRef = useRef<THREE.Object3D[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A raised south-side viewpoint looks north over the landmarks; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 500, z: 700 })
        camera.lookAt(0, 0, 0)

        PLACES.forEach(({ point, color }) => {
          const radius = 35
          const marker = new THREE.Mesh(
            new THREE.SphereGeometry(radius, 24, 16),
            new THREE.MeshBasicMaterial({ color })
          )
          // The scene carries its own GeoReference and projects the point itself.
          scene.setPosition(marker, point)
          // Rest the sphere on the ground plane instead of burying its lower half.
          marker.position.y = radius
          scene.add(marker)
          objectsRef.current.push(marker)
        })
      }

      useEffect(() => {
        return () => {
          objectsRef.current.forEach((object) => {
            object.removeFromParent()
            const mesh = object as THREE.Mesh
            mesh.geometry?.dispose()
            ;(mesh.material as THREE.Material | undefined)?.dispose()
          })
          objectsRef.current = []
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          origin={ORIGIN}
          onCreated={handleCreated}
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```

  </TabItem>
</Tabs>

## Scene Props

| Property | Type                           | Default                               | Description                                                            |
| -------- | ------------------------------ | ------------------------------------- | ---------------------------------------------------------------------- |
| origin   | GeoPoint                       | `{ lng: 0, lat: 0, alt: 0 }`          | Local tangent-plane origin; all scene coordinates are relative to it   |
| crs      | `'EPSG:4326' \| 'EPSG:3857'`   | `'EPSG:4326'`                         | Planar model: equirectangular tangent plane or recentered Web Mercator |
| datum    | `'WGS84' \| 'GCJ02' \| 'BD09'` | `'WGS84'`                             | Datum of the coordinates passed to the scene                           |
| axes     | AxesMapping                    | `{ east: 'x', north: '-z', up: 'y' }` | Maps the ENU basis onto signed three.js axes                           |
| geo      | GeoReference                   | —                                     | Supply a pre-built reference instead of `origin`/`crs`/`datum`/`axes`  |

The reference built by the Scene is available as `components.geo` inside the
`onCreated(scene, components)` callback and via `useScene().geo`. It is also
bound to the scene itself, so most code never has to name `geo` at all.

## Positioning Objects

Every Scene binds its `GeoReference` to the scene instance and installs one
positioning helper, `scene.setPosition(object, position, datum?)`. Because the
scene already knows its own reference, a geographic position needs only the
coordinates themselves — no reference threading — and the exact same call places
a mesh, a group or a camera, since all of them are `THREE.Object3D`.

The position accepts every convenient shape (`ScenePosition`):

| Position shape | Interpretation |
| --- | --- |
| `{ lng, lat, alt? }` | Geographic point, projected through the scene's reference |
| `[lng, lat]` | Geographic point, altitude defaults to `0` |
| `[lng, lat, alt]` | Geographic point as a plain tuple |
| `THREE.Vector3` | Local metres, used as-is (no projection) |
| `{ x, y, z? }` | Local metres as a plain object, `z` defaults to `0` |

```ts
const handleCreated = (scene: THREE.Scene) => {
  // All four are geographic and projected through the scene's own reference.
  scene.setPosition(mesh, { lng: 116.397, lat: 39.909 })
  scene.setPosition(mesh, { lng: 116.397, lat: 39.909, alt: 35 })
  scene.setPosition(mesh, [116.397, 39.909])
  scene.setPosition(mesh, [116.397, 39.909, 35])

  // A per-call datum overrides the scene datum for GCJ02/BD09 input.
  scene.setPosition(mesh, [116.403, 39.915], 'GCJ02')

  // A camera is positioned with the identical call.
  scene.setPosition(camera, [116.397428, 39.90923, 120])

  // Local metres are used directly, no projection.
  scene.setPosition(helper, new THREE.Vector3(10, 0, -5))
  scene.setPosition(helper, { x: 10, y: 0, z: -5 })
}
```

The method returns the object passed in, so calls can chain. A scene you create
yourself without R3L has no helper; either call `bindSceneGeo(scene, geo)` once
or read the reference with `getSceneGeo(scene)`. On a scene with helpers but no
bound reference, geographic tuples/objects fall back to local coordinates and
map `lng/lat/alt` straight onto `x/y/z`, so the call is always safe.

| Helper | Signature | Description |
| --- | --- | --- |
| scene.setPosition | (object: Object3D, position: ScenePosition, datum?: DatumType) => Object3D | Place any object; geographic inputs are projected, local metres used as-is |
| scene.getGeo | () => GeoReference \| undefined | Read the reference bound to the scene |
| bindSceneGeo | (scene: Scene, geo?: GeoReference) => Scene | Install the helpers on a scene and optionally bind a reference |
| getSceneGeo | (scene: Scene) => GeoReference \| undefined | Functional equivalent of `scene.getGeo()` |

## GeoReference Methods

| Name        | Parameters                                                         | Description                                        |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------- |
| constructor | (origin?: GeoPoint, options?: GeoReferenceOptions) => GeoReference | Builds the reference and its tangent plane         |
| toLocal     | (p: GeoPoint, datum?: DatumType, target?: Vector3) => Vector3      | Geographic point -> local metres                   |
| toGeo       | (v: Vector3, datum?: DatumType, target?: GeoPoint) => GeoPoint     | Local metres -> geographic point                   |
| setPosition | (object: Object3D, p: GeoPoint, datum?: DatumType) => Object3D     | Places an existing object at a geographic position |
| distance    | (a: GeoPoint, b: GeoPoint, datum?: DatumType) => number            | Planar distance in metres                          |

```ts
import { GeoReference } from 'react-three-lite'
import type { GeoPoint } from 'react-three-lite'

const origin: GeoPoint = { lng: 116.397, lat: 39.909 }
const geo = new GeoReference(origin, { crs: 'EPSG:4326', datum: 'WGS84' })

// Local metres relative to the origin (float64 internally).
const local = geo.toLocal({ lng: 116.4005, lat: 39.909 })

// Convert back; pass a per-call datum when mixing data sources.
const back = geo.toGeo(local)

// GCJ02 (AMap/Tencent) input is normalized automatically.
const fromMars = geo.toLocal({ lng: 116.403, lat: 39.915 }, 'GCJ02')
```

## Camera Framing

`fitCameraToPoints` is a single, coordinate-agnostic framing entry point. It
inspects the **shape** of each point instead of asking you whether the scene is
GIS or not:

- A geographic point (`{ lng, lat, alt? }`) is projected to local metres through
  `options.geo` (honouring `options.datum`).
- A local point (`THREE.Vector3` or `{ x, y, z? }`) is used as-is.

Because every Scene always exposes a `GeoReference` (a no-op for ordinary
non-GIS scenes), the same call works in both worlds. Geographic and local points
must not be mixed in one call (it throws), and geographic points require
`options.geo`. An empty array is a no-op.

```ts
import { fitCameraToPoints } from 'react-three-lite'
import { isGeoPoint } from 'react-three-lite'

// GIS scene: {lng, lat} points are detected and projected automatically.
fitCameraToPoints(camera, [{ lng: 116.4, lat: 39.9 }], {
  geo,
  datum: 'WGS84',
  controls
})

// Plain scene: local metre points are used directly, no geo needed.
fitCameraToPoints(camera, [new THREE.Vector3(-2, 0, -2), { x: 2, y: 0, z: 2 }])

isGeoPoint({ lng: 116.4, lat: 39.9 }) // true
isGeoPoint(new THREE.Vector3(0, 0, 0)) // false
```

| Function             | Signature                                                                     | Description                                               |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| fitCameraToPoints    | (camera, points: FitPoint[], options?: FitPointsOptions) => PerspectiveCamera | Unified framing; auto-detects geographic vs local points  |
| isGeoPoint           | (point: FitPoint) => boolean                                                  | Type guard: true when the point carries `lng`/`lat`       |
| fitCameraToBox       | (camera, box: Box3, options?) => PerspectiveCamera                            | Frame an explicit local-metre box                         |
| fitCameraToObject    | (camera, object: Object3D \| Object3D[], options?) => PerspectiveCamera       | Frame object world bounds                                 |
| fitCameraToGeoPoints | (camera, points: GeoPoint[], geo, datum?, options?) => PerspectiveCamera      | Legacy geographic-only wrapper around `fitCameraToPoints` |

`FitPoint = GeoPoint | LocalPoint`, where `LocalPoint = THREE.Vector3 | { x, y, z? }`.

`FitPointsOptions` adds `geo?: GeoReference` (required for geographic points) and
`datum?: DatumType` on top of the shared framing options:

| Option     | Type                           | Default            | Description                                                       |
| ---------- | ------------------------------ | ------------------ | ----------------------------------------------------------------- |
| geo        | GeoReference                   | —                  | Projects geographic points; always available via `components.geo` |
| datum      | `'WGS84' \| 'GCJ02' \| 'BD09'` | GeoReference datum | Datum of the geographic inputs                                    |
| elevation  | number                         | `PI/4`             | Viewing elevation in radians; `PI/2` is top-down                  |
| azimuth    | number                         | `PI/4`             | Camera bearing clockwise from north (-Z)                          |
| padding    | number                         | `1.4`              | Distance multiplier; >1 leaves margin                             |
| distance   | number                         | computed           | Override the computed distance (metres)                           |
| adjustClip | boolean                        | `true`             | Derive near/far planes from the content scale                     |
| controls   | OrbitControls                  | —                  | Sync the controls target to the bounds centre                     |

### FitCamera

`FitCamera` is a drop-in replacement for the camera you already pass to
`<Scene camera={...} />`. It extends `THREE.PerspectiveCamera` with the same
constructor parameters and keeps a plain native `position`, so the default
camera creation and the `camera` prop are unchanged — a `FitCamera` is simply an
optional camera you can supply. Positioning is identical to every other object:
ask the scene to place it.

```ts
import { useRef } from 'react'
import * as THREE from 'three'
import { Scene, FitCamera } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

function App() {
  const cameraRef = useRef<FitCamera | null>(null)

  if (!cameraRef.current) cameraRef.current = new FitCamera()

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { controls, geo } = components
    const camera = cameraRef.current
    if (!camera || !geo) return

    camera.bind(geo, controls)
    // The same scene helper that anchors a mesh positions the camera; the
    // tuple is projected through the scene's GeoReference automatically.
    scene.setPosition(camera, [116.397428, 39.90923, 120])
    controls?.target.set(0, 0, 0)
    controls?.update()
  }

  return <Scene camera={cameraRef.current} onCreated={handleCreated} />
}
```

`camera.position` stays an ordinary `THREE.Vector3`, so all vector math used by
OrbitControls (`copy`, `add`, `sub`, `addScaledVector`, …) and the local-metre
`position.set(x, y, z)` behave exactly as before — there is nothing GIS-specific
to learn for non-GIS scenes. Projection happens only when you explicitly route
a geographic point through `scene.setPosition`.

For automatic framing, the camera also owns the framing operations above, so you
no longer have to thread `camera`/`geo`/`controls` through every call. Every
method returns `this` for chaining.

```ts
// Geographic points use the bound geo (a per-call datum/geo still wins).
camera.fitToPoints(
  [
    { lng: 116.397428, lat: 39.90923 },
    { lng: 116.4005, lat: 39.9117 }
  ],
  { datum: 'WGS84', azimuth: Math.PI }
)

// Local metre points, objects and explicit boxes need no binding.
camera.fitToPoints([new THREE.Vector3(-2, 0, -2), { x: 2, y: 0, z: 2 }])
camera.fitToObject(mesh, { padding: 1.2 })
camera.fitToObject([mesh1, mesh2])
camera.fitToBox(new THREE.Box3().setFromObject(group))
```

The constructor mirrors `THREE.PerspectiveCamera` and defaults to
`(fov = 75, aspect = 1, near = 0.1, far = 1000)`, positioned at `(0, 0, 1)` like
the Scene's default camera; when the camera is owned by a Scene, the resize
handler syncs `aspect` to the container on mount and whenever it is resized.

| Method      | Signature                                                                 | Description                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| constructor | (fov?: number, aspect?: number, near?: number, far?: number) => FitCamera | Same parameters as `THREE.PerspectiveCamera`                                                                                                        |
| bind        | (geo?: GeoReference \| null, controls?: OrbitControls \| null) => this    | Bind references for later `fitTo*` calls. Only passed arguments are updated, pass `null` to clear |
| fitToPoints | (points: FitPoint[], options?: FitCameraOptions) => this                  | Frame points; geographic `{lng, lat}` vs local points is auto-detected                                                                              |
| fitToObject | (object: Object3D \| Object3D[], options?: CameraFitOptions) => this      | Frame the world-space bounds of one or more objects                                                                                                 |
| fitToBox    | (box: Box3, options?: CameraFitOptions) => this                           | Frame an explicit local-metre box                                                                                                                   |

`FitCameraOptions` is the shared framing option set with optional `geo` and
`datum`, so any field may be supplied per call and overrides the bound value;
per-call `controls` likewise overrides the bound controls.

## Datum Helpers

Chinese map services use encrypted datums; mixing them with raw GPS (WGS84)
data without conversion causes offsets of 50–600 metres inside China.

| Function                    | Signature                                                 | Description                 |
| --------------------------- | --------------------------------------------------------- | --------------------------- |
| toWGS84                     | (p: GeoPoint, from: DatumType) => GeoPoint                | Convert GCJ02/BD09 to WGS84 |
| fromWGS84                   | (p: GeoPoint, to: DatumType) => GeoPoint                  | Convert WGS84 to GCJ02/BD09 |
| convertDatum                | (p: GeoPoint, from: DatumType, to: DatumType) => GeoPoint | Convert between any datums  |
| wgs84ToGcj02 / gcj02ToWgs84 | (p: GeoPoint) => GeoPoint                                 | Direct WGS84 `<->` GCJ02    |
| gcj02ToBd09 / bd09ToGcj02   | (p: GeoPoint) => GeoPoint                                 | Direct GCJ02 `<->` BD09     |

The GCJ02 -> WGS84 inverse uses fixed-point iteration; the BD09 closed-form
inverse has an inherent residual of a few centimetres.

## Projection Helpers

| Function                       | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| mercatorProject(p)             | EPSG:4326 degrees -> EPSG:3857 Web Mercator metres |
| mercatorUnproject(v)           | EPSG:3857 metres -> EPSG:4326 degrees              |
| createLocalPlane(code, origin) | Builds a recentered `LocalPlane` for either CRS    |
