---
lang: zh-CN
title: GeoObject 地理对象
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoObject'

## 类型

组件

## 默认用法

`GeoObject` 将一个 `Object3D` 锚定到地理坐标上。不传 `object` 时，组件会创建一个空的
`THREE.Group` 并通过 `onReady` 交给你，你可以在其中添加标记、标签或已加载的模型。更新
`coordinate` 或 `datum` 时会直接移动物体，不会重新构建。

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <App />

    ```tsx
    import * as THREE from 'three'
    import { Scene, GeoObject } from 'react-three-lite'
    import type { GeoPoint, SceneComponents } from 'react-three-lite'

    // Scene 原点使用 WGS84。
    const ORIGIN: GeoPoint = { lng: 116.391, lat: 39.907 }

    // GCJ02 坐标，例如高德/腾讯服务返回的坐标。
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

## 锚定已有对象

传入自己的 `Object3D` 时，对象的归属仍属于调用方：组件会把它重新挂到 Scene
下，卸载时再恢复到原来的父节点。

```tsx
const model = new THREE.Group()

<GeoObject coordinate={{ lng: 116.397, lat: 39.909 }} object={model} />
```

## Props

| 名称 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| coordinate | GeoPoint | — | 地理锚点，采用 `datum` 声明的基准面 |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene 的 datum | `coordinate` 所使用的基准面 |
| object | THREE.Object3D | 自动创建 Group | 要锚定的已有对象 |
| onReady | (object: Object3D) => void | — | 对象就绪后回调一次 |
| scene | THREE.Scene | 上下文中的 scene | 非 JSX 用法下显式指定场景 |

## 事件

| 名称 | 参数 | 描述 |
|------|------|------|
| onReady | (object: THREE.Object3D) => void | 对象被添加到场景并完成定位后触发 |
