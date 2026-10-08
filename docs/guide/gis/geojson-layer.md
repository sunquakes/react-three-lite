---
id: geojson-layer
lang: en-US
title: GeoJsonLayer
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoJsonLayer'

## Type

Component

## Default Usage

`GeoJsonLayer` renders [GeoJSON](https://geojson.org/) data (`FeatureCollection`,
`Feature` or a bare geometry) inside the Scene's `GeoReference`. Supported
geometry types are `Point`, `MultiPoint`, `LineString`, `MultiLineString`,
`Polygon` and `MultiPolygon`, including polygon holes.

- Points render as diamond markers using one merged `LineSegments` draw call.
- Lines render as `LineSegments` rings.
- Polygons render as flat ground fills (`ShapeGeometry`) or extruded blocks
  (`ExtrudeGeometry`) when `extrudeHeight > 0`.
- Returning `null` from `featureStyle` skips a feature entirely.

Every example below can be viewed with either the **WebGPU** (default) or the
**WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <App />

    ```tsx
    import * as THREE from 'three'
    import { Scene, GeoJsonLayer } from 'react-three-lite'
    import type { GeoJsonData, GeoJsonStyle, SceneComponents } from 'react-three-lite'

    const ORIGIN = { lng: 116.397, lat: 39.909 }

    const data: GeoJsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { kind: 'park' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [116.395, 39.9095],
                [116.399, 39.9095],
                [116.399, 39.9115],
                [116.395, 39.9115],
                [116.395, 39.9095]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [116.397, 39.909]
          }
        }
      ]
    }

    const COLORS: Record<string, GeoJsonStyle> = {
      park: { fillColor: 0x4caf50, strokeColor: 0xb9f6ca, opacity: 0.7 }
    }

    function App() {
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
        // A fixed south-side viewpoint looks north over the dataset; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 500, z: 700 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          origin={ORIGIN}
          gridHelper={grid}
          onCreated={handleCreated}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <GeoJsonLayer
            data={data}
            style={{ strokeColor: 0x9fd0ff, pointColor: 0xffd166, pointSize: 40 }}
            featureStyle={(feature) => {
              const kind = feature.properties?.kind
              return typeof kind === 'string' ? COLORS[kind] : undefined
            }}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <App rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, GeoJsonLayer } from 'react-three-lite'
    import type { GeoJsonData, GeoJsonStyle, SceneComponents } from 'react-three-lite'

    const ORIGIN = { lng: 116.397, lat: 39.909 }

    const data: GeoJsonData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { kind: 'park' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [116.395, 39.9095],
                [116.399, 39.9095],
                [116.399, 39.9115],
                [116.395, 39.9115],
                [116.395, 39.9095]
              ]
            ]
          }
        },
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [116.397, 39.909]
          }
        }
      ]
    }

    const COLORS: Record<string, GeoJsonStyle> = {
      park: { fillColor: 0x4caf50, strokeColor: 0xb9f6ca, opacity: 0.7 }
    }

    function App() {
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
        // A fixed south-side viewpoint looks north over the dataset; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 500, z: 700 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          rendererType="webgl"
          origin={ORIGIN}
          gridHelper={grid}
          onCreated={handleCreated}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <GeoJsonLayer
            data={data}
            style={{ strokeColor: 0x9fd0ff, pointColor: 0xffd166, pointSize: 40 }}
            featureStyle={(feature) => {
              const kind = feature.properties?.kind
              return typeof kind === 'string' ? COLORS[kind] : undefined
            }}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## GCJ02 / BD09 Data

When the data itself is encrypted (the typical case for tiles or data exported
from Chinese map services), pass `datum` to the layer or set it once on the
Scene. Coordinates are normalized before projection.

```tsx
<GeoJsonLayer data={amapData} datum="GCJ02" />
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| data | GeoJsonData | — | A FeatureCollection, Feature or bare geometry object |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene datum | Datum of the feature coordinates |
| style | GeoJsonStyle | see below | Base style for all features |
| featureStyle | (feature: GeoJsonFeature) => GeoJsonStyle \| null \| undefined | — | Per-feature override; `null` skips the feature |
| onReady | (group: THREE.Group) => void | — | Fired when the layer has been built and added |
| scene | THREE.Scene | context scene | Explicit scene for non-JSX usage |

## GeoJsonStyle

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| fillColor | ColorRepresentation | 0x4a90d9 | Polygon fill color |
| strokeColor | ColorRepresentation | 0x9fd0ff | Polygon outline and line string color |
| pointColor | ColorRepresentation | 0xffd166 | Point marker color |
| pointSize | number | 20 | Point marker size in world metres |
| extrudeHeight | number | 0 | Polygon extrusion height in metres; 0 renders flat |
| opacity | number | 0.85 | Fill opacity |

## Events

| Name | Parameters | Description |
|------|------------|-------------|
| onReady | (group: THREE.Group) => void | Fired once after the layer group is added to the scene |
