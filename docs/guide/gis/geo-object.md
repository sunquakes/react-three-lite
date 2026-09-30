---
id: geo-object
lang: en-US
title: GeoObject
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoObject'

## Type

Component

## Default Usage

`GeoObject` anchors an `Object3D` at a geographic coordinate. Without an
`object` prop it creates an empty `THREE.Group` and hands it to `onReady`,
where you can add markers, labels or loaded models. Updating `coordinate` or
`datum` moves the object in place without rebuilding it.

Every example below can be viewed with either the **WebGPU** (default) or the
**WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <App />

    ```tsx
    import * as THREE from 'three'
    import { Scene, GeoObject } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    // Scene origin in WGS84.
    const ORIGIN: GeoPoint = { lng: 116.391, lat: 39.907 }

    // GCJ02 coordinates, as returned by AMap/Tencent services.
    const MARKERS: GeoPoint[] = [
      { lng: 116.397428, lat: 39.90923 },
      { lng: 116.4005, lat: 39.9117 },
      { lng: 116.3945, lat: 39.912 }
    ]

    function decorate(object: THREE.Object3D) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(40, 120, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      )
      cone.position.y = 60
      object.add(cone)
    }

    function App() {
      // The built-in grid is 20 m by default; a city-scale scene customises
      // it through gridHelper options, and Scene owns its disposal.
      const grid = {
        size: 1400,
        divisions: 28,
        colorCenterLine: 0x4a6fa5,
        colorGrid: 0x2f3e5c
      }

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A raised south-side viewpoint looks north over the markers; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 750, z: 1000 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          origin={ORIGIN}
          gridHelper={grid}
          onCreated={handleCreated}
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          {MARKERS.map((coordinate, index) => (
            <GeoObject key={index} coordinate={coordinate} datum="GCJ02" onReady={decorate} />
          ))}
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <App rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, GeoObject } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    const ORIGIN: GeoPoint = { lng: 116.391, lat: 39.907 }
    const MARKERS: GeoPoint[] = [
      { lng: 116.397428, lat: 39.90923 },
      { lng: 116.4005, lat: 39.9117 },
      { lng: 116.3945, lat: 39.912 }
    ]

    function decorate(object: THREE.Object3D) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(40, 120, 24),
        new THREE.MeshBasicMaterial({ color: 0xffd166 })
      )
      cone.position.y = 60
      object.add(cone)
    }

    function App() {
      // The built-in grid is 20 m by default; a city-scale scene customises
      // it through gridHelper options, and Scene owns its disposal.
      const grid = {
        size: 1400,
        divisions: 28,
        colorCenterLine: 0x4a6fa5,
        colorGrid: 0x2f3e5c
      }

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        // A raised south-side viewpoint looks north over the markers; the scene
        // places the camera from local metres and it looks back at the origin.
        scene.setPosition(camera, { x: 0, y: 750, z: 1000 })
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          rendererType="webgl"
          origin={ORIGIN}
          gridHelper={grid}
          onCreated={handleCreated}
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          {MARKERS.map((coordinate, index) => (
            <GeoObject key={index} coordinate={coordinate} datum="GCJ02" onReady={decorate} />
          ))}
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Anchoring an Existing Object

Passing your own `Object3D` keeps ownership with the caller: the component
reparents it into the Scene and restores the original parent on unmount.

```tsx
const model = new THREE.Group()

<GeoObject coordinate={{ lng: 116.397, lat: 39.909 }} object={model} />
```

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| coordinate | GeoPoint | — | Geographic anchor in the datum declared by `datum` |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene datum | Datum of `coordinate` |
| object | THREE.Object3D | creates a Group | Existing object to anchor |
| onReady | (object: Object3D) => void | — | Called once with the anchored object |
| scene | THREE.Scene | context scene | Explicit scene for non-JSX usage |

## Events

| Name | Parameters | Description |
|------|------------|-------------|
| onReady | (object: THREE.Object3D) => void | Fired when the object has been added and positioned |
