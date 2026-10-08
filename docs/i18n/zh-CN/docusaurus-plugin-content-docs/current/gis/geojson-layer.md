---
lang: zh-CN
title: GeoJsonLayer 地理图层
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoJsonLayer'

## 类型

组件

## 默认用法

`GeoJsonLayer` 在 Scene 的 `GeoReference` 中渲染 [GeoJSON](https://geojson.org/)
数据（`FeatureCollection`、`Feature` 或裸几何对象）。支持的几何类型包括
`Point`、`MultiPoint`、`LineString`、`MultiLineString`、`Polygon` 和
`MultiPolygon`，多边形支持洞（holes）。

- 点合并为一次 `LineSegments` 绘制调用，渲染为菱形标记。
- 线以 `LineSegments` 环的方式渲染。
- 多边形默认为贴地平面填充（`ShapeGeometry`），当 `extrudeHeight > 0` 时渲染为拉伸体（`ExtrudeGeometry`）。
- `featureStyle` 返回 `null` 可完全跳过某个要素。

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

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

## GCJ02 / BD09 数据

当地理数据本身是加密坐标时（国内地图服务导出数据的常见情况），给图层传入
`datum`，或者在 Scene 上统一配置一次即可。坐标会在投影前完成归一化。

```tsx
<GeoJsonLayer data={amapData} datum="GCJ02" />
```

## Props

| 名称 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| data | GeoJsonData | — | FeatureCollection、Feature 或裸几何对象 |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene 的 datum | 要素坐标所使用的基准面 |
| style | GeoJsonStyle | 见下表 | 所有要素的基础样式 |
| featureStyle | (feature: GeoJsonFeature) => GeoJsonStyle \| null \| undefined | — | 按要素覆盖样式；返回 `null` 跳过该要素 |
| onReady | (group: THREE.Group) => void | — | 图层构建完成后触发 |
| scene | THREE.Scene | 上下文中的 scene | 非 JSX 用法下显式指定场景 |

## GeoJsonStyle

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| fillColor | ColorRepresentation | 0x4a90d9 | 多边形填充色 |
| strokeColor | ColorRepresentation | 0x9fd0ff | 多边形描边和线串颜色 |
| pointColor | ColorRepresentation | 0xffd166 | 点标记颜色 |
| pointSize | number | 20 | 点标记大小（世界坐标米） |
| extrudeHeight | number | 0 | 多边形拉伸高度（米）；0 表示贴地平面 |
| opacity | number | 0.85 | 填充不透明度 |

## 事件

| 名称 | 参数 | 描述 |
|------|------|------|
| onReady | (group: THREE.Group) => void | 图层组添加到场景后触发一次 |
