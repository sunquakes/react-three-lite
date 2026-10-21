---
id: tile-layer
lang: en-US
title: Tile Layer
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/TileLayer'

## Type

Component

## Default Usage

`TileLayer` projects standard XYZ / slippy-map raster tiles (256 px, Web
Mercator, the scheme used by OpenStreetMap, AMap and Tianditu) onto the flat
ground plane of the Scene's `GeoReference`.

- Pass the tile source as a `url` template with `{z}`, `{x}`, `{y}` and an
  optional `{s}` subdomain placeholder.
- By default the layer follows the camera: the visible ground rectangle (the
  camera frustum projected onto the ground plane) is tiled at the given
  `zoom`, so the basemap always covers the whole viewport, and tiles are
  loaded/disposed automatically as you pan, zoom or orbit. A `padding` ring
  of extra tiles keeps the map covered while moving.
- For a fixed basemap instead, pass the geographic corners it must cover as
  `points` (with `followCamera={false}`); every tile intersecting their
  bounding rectangle is requested once.
- Tile images load lazily and fade in as they arrive; tiles use a plain
  `MeshBasicMaterial`, so the layer works with both the WebGPU and WebGL
  renderer.
- A `GeoObject` anchored at a WGS84 (GPS standard) coordinate drops a pin
  marker on the map; its `onReady` callback adds a cone mesh to the internal
  Group, which is disposed on unmount.

The tile imagery's datum must match the `datum` prop (and, in static mode,
the datum of the coverage points). OSM imagery is indexed in WGS84, so the
Scene's default datum is enough.

Every example below can be viewed with either the **WebGPU** (default) or the
**WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <App />

    ```tsx
    import * as THREE from 'three'
    import { Scene, TileLayer, GeoObject } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    // WGS84 (GPS standard) point near Suzhou; used as both the local origin and the pin anchor.
    const PIN: GeoPoint = { lng: 120.60682, lat: 31.330898 }
    const ORIGIN = PIN

    // OpenStreetMap standard raster tiles are indexed in WGS84 coordinates.
    const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const TILE_ZOOM = 15

    // GeoObject creates an internal Group and disposes its meshes on unmount.
    const decoratePin = (anchor: THREE.Object3D) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(40, 120, 24),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 })
      )
      // Lift the cone so its base sits on the ground.
      cone.position.y = 60
      anchor.add(cone)
    }

    function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A fixed south-side viewpoint keeps the raster map readable like a
        // conventional map; looking north from due south keeps it north-up.
        scene.setPosition(camera, { x: 0, y: 600, z: 850 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          origin={ORIGIN}
          gridHelper={false}
          onCreated={handleCreated}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <TileLayer url={TILE_URL} zoom={TILE_ZOOM} datum="WGS84" />
          <GeoObject coordinate={PIN} datum="WGS84" onReady={decoratePin} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <App rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, TileLayer, GeoObject } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    // WGS84 (GPS standard) point near Suzhou; used as both the local origin and the pin anchor.
    const PIN: GeoPoint = { lng: 120.60682, lat: 31.330898 }
    const ORIGIN = PIN

    // OpenStreetMap standard raster tiles are indexed in WGS84 coordinates.
    const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const TILE_ZOOM = 15

    // GeoObject creates an internal Group and disposes its meshes on unmount.
    const decoratePin = (anchor: THREE.Object3D) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(40, 120, 24),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 })
      )
      // Lift the cone so its base sits on the ground.
      cone.position.y = 60
      anchor.add(cone)
    }

    function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A fixed south-side viewpoint keeps the raster map readable like a
        // conventional map; looking north from due south keeps it north-up.
        scene.setPosition(camera, { x: 0, y: 600, z: 850 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          rendererType="webgl"
          origin={ORIGIN}
          onCreated={handleCreated}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <TileLayer url={TILE_URL} zoom={TILE_ZOOM} datum="WGS84" />
          <GeoObject coordinate={PIN} datum="WGS84" onReady={decoratePin} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## GCJ02 Imagery

Chinese map services such as AMap (Gaode) and Tencent publish tiles in GCJ02
coordinates. Set `datum="GCJ02"` (and, in static `points` mode, pass coverage
points expressed in GCJ02). Tile selection and corner placement then share
the same datum, so the non-linear GCJ02 shift is absorbed per tile corner and
adjacent tiles stay seamless. The `{s}` placeholder can be customized with
`subdomains`.

```tsx
const AMAP_URL =
  'https://webrst.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'

<TileLayer url={AMAP_URL} zoom={15} datum="GCJ02" />
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| url | string | — | Tile URL template with `{z}`, `{x}`, `{y}` and optional `{s}` |
| zoom | number | — | Slippy-map zoom level (non-negative integer) |
| followCamera | boolean | true | Tile the visible ground rectangle every time the camera moves; when false, `points` defines a fixed coverage |
| points | GeoPoint[] | — | Static coverage corners in `datum`, used when `followCamera` is false |
| padding | number | 1 | Extra tile rings loaded beyond the visible rectangle so the map stays covered while panning |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene datum | Datum of the tile imagery (and of `points` in static mode) |
| subdomains | string[] | `['a','b','c']` | Values cycling through the `{s}` placeholder |
| opacity | number | 1 | Opacity of the tile images |
| y | number | 0.05 | Height in local metres at which the ground quads are laid |
| fog | boolean | true | Distance fog anchored to the edge of the tiled coverage plus a background-tinted backing plane, so the map dissolves into the background at oblique angles instead of ending in a hard rectangle; the anchor re-fits as the camera zooms or orbits |
| groundColor | number \| string | Scene `bgColor`, else `#1a1a2e` | Colour of the distance fog and backing plane; set it to the Scene `bgColor` when using a background image |
| maxTiles | number | 256 | Cap on retained tiles; camera-following keeps the nearest ones, static mode throws when exceeded |
| maxPolarAngle | number | `PI/3` (60°) | Largest OrbitControls polar angle (radians from +y) allowed while following the camera; the same 60-degree camera-pitch ceiling MapLibre uses on flat maps, past which planar ground tiles stretch into blurred ribbons and the tiled coverage can no longer stay ahead of the horizon. A stricter existing limit is kept and the original value is restored on unmount |
| onReady | (group: THREE.Group) => void | — | Fired after all tile meshes were created |
| onTileError | (index: TileIndex, url: string) => void | — | Fired when one tile image fails to download; the tile stays hidden |
| scene | THREE.Scene | context scene | Explicit scene for non-JSX usage |

## Tile Math Utilities

The underlying slippy-map functions are exported for custom tile workflows.

| Name | Parameters | Description |
|------|------------|-------------|
| TILE_SIZE | — | Edge length of a standard tile in pixels (256) |
| lngLatToTile | (lng: number, lat: number, zoom: number) => TileIndex | Tile column/row covering a coordinate; longitude wraps at the antimeridian and latitude is clamped to ±85.05112878 |
| tileToLngLatBounds | (index: TileIndex) => TileBounds | West/north/east/south bounds of a tile in degrees |
| tileToCorners | (index: TileIndex) => TileCorners | NW/NE/SE/SW corner coordinates of a tile |
| selectTiles | (points: GeoPoint[], zoom: number) => TileIndex[] | Every tile intersecting the bounding rectangle of the points |
| selectTilesInBounds | (west: number, south: number, east: number, north: number, zoom: number, padding?: number) => TileIndex[] | Every tile intersecting a west/south/east/north rectangle, expanded by `padding` rings; antimeridian-safe |
| tileUrl | (template: string, index: TileIndex, subdomains?: string[]) => string | Expands the `{s}`/`{z}`/`{x}`/`{y}` placeholders |

## Events

| Name | Parameters | Description |
|------|------------|-------------|
| onReady | (group: THREE.Group) => void | Fired once after the layer group is added to the scene |
| onTileError | (index: TileIndex, url: string) => void | Fired when one tile image fails to download |
