---
lang: zh-CN
title: TileLayer 瓦片底图
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/TileLayer'

## 类型

组件

## 默认用法

`TileLayer` 将标准 XYZ / 滑窗地图栅格瓦片（256 像素、Web Mercator 投影，
即 OpenStreetMap、高德、天地图所使用的方案）投影到 Scene 的 `GeoReference`
地面平面上。

- `url` 传入瓦片地址模板，支持 `{z}`、`{x}`、`{y}` 以及可选的 `{s}` 子域占位符。
- 默认情况下图层跟随相机：将可见地面矩形（相机视锥投影到地面平面）按给定 `zoom` 铺满瓦片，底图始终覆盖整个视口；平移、缩放或旋转相机时自动加载/卸载瓦片。`padding` 外扩瓦片圈保证移动过程中地图不露底。
- 如需固定底图，可通过 `points` 传入需要覆盖的地理角点（并设置 `followCamera={false}`）；组件会一次性请求与其包围矩形相交的所有瓦片。
- 瓦片图片懒加载，到达后淡入；瓦片使用普通 `MeshBasicMaterial`，因此 WebGPU 与 WebGL 渲染器均可用。
- 默认开启空气透视：锚定到瓦片覆盖边缘的距离雾，加上一块与背景同色的衬底平面，使瓦片区域在倾斜视角下自然融入背景，不露出生硬的矩形边界；缩放或环绕相机时雾的锚点会自动重新拟合。不需要时可设 `fog={false}`；背景为图片时可用 `groundColor` 指定雾与衬底的颜色。
- 用锚定到 WGS84（GPS 标准）坐标的 `GeoObject` 在地图上放置图钉；其 `onReady` 回调向内部 Group 添加一个圆锥 mesh，卸载时自动销毁。

瓦片影像的 datum（基准面）必须与 `datum` 属性一致（静态模式下覆盖点亦同）。
OSM 影像以 WGS84 索引，因此使用 Scene 默认 datum 即可。

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

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
          onCreated={handleCreated}
          bgColor="#1a1a2e"
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
          gridHelper={false}
          onCreated={handleCreated}
          bgColor="#1a1a2e"
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

## GCJ02 影像

高德、腾讯等国内地图服务发布的瓦片使用 GCJ02 坐标。请设置 `datum="GCJ02"`
（静态 `points` 模式下覆盖点也需以 GCJ02 表达）。此时选瓦与放瓦共享同一
datum，非线性的 GCJ02 偏移会逐瓦片角点吸收，相邻瓦片保持无缝。`{s}` 占位符
可通过 `subdomains` 自定义。

```tsx
const AMAP_URL =
  'https://webrst.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'

<TileLayer url={AMAP_URL} zoom={15} datum="GCJ02" />
```

## Props

| 名称 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| url | string | — | 瓦片 URL 模板，含 `{z}`、`{x}`、`{y}` 及可选 `{s}` |
| zoom | number | — | 滑窗地图缩放级别（非负整数） |
| followCamera | boolean | true | 相机每次移动后重新铺满可见地面矩形；为 false 时由 `points` 定义固定覆盖范围 |
| points | GeoPoint[] | — | 静态覆盖角点，坐标使用 `datum`，在 `followCamera` 为 false 时生效 |
| padding | number | 1 | 在可见矩形之外多加载的瓦片圈数，保证平移过程中地图不露底 |
| datum | `'WGS84' \| 'GCJ02' \| 'BD09'` | Scene 的 datum | 瓦片影像的基准面（静态模式下覆盖点亦同） |
| subdomains | string[] | `['a','b','c']` | 轮流填充 `{s}` 占位符的值 |
| opacity | number | 1 | 瓦片图片不透明度 |
| y | number | 0.05 | 地面瓦片铺设高度（本地坐标米） |
| fog | boolean | true | 锚定到瓦片覆盖边缘的距离雾与背景同色衬底平面，使瓦片区域在倾斜视角下融入背景，不露出生硬的矩形边界；缩放或环绕时锚点自动重新拟合 |
| groundColor | number \| string | Scene 的 bgColor，否则 `#1a1a2e` | 距离雾与衬底平面的颜色；Scene 背景为图片时手动指定为与背景相近的颜色 |
| maxTiles | number | 256 | 保留瓦片数上限；相机跟随模式保留最近者，静态模式超出时抛错 |
| maxPolarAngle | number | `PI/3`（60°） | 相机跟随模式下允许的最大 OrbitControls 极角（与 +y 轴夹角，弧度）；与 MapLibre 平面地图的 60° 相机俯仰上限一致，超过该角度平面瓦片会被拉伸成模糊条带且瓦片覆盖无法跑赢地平线。已存在的更严格限制不会被放宽，卸载时还原原值 |
| onReady | (group: THREE.Group) => void | — | 全部瓦片网格创建后触发 |
| onTileError | (index: TileIndex, url: string) => void | — | 某张瓦片下载失败时触发；该瓦片保持隐藏 |
| scene | THREE.Scene | 上下文中的 scene | 非 JSX 用法下显式指定场景 |

## 瓦片数学工具

底层滑窗地图函数已导出，可用于自定义瓦片工作流。

| 名称 | 参数 | 描述 |
|------|------|------|
| TILE_SIZE | — | 标准瓦片边长（像素），值为 256 |
| lngLatToTile | (lng: number, lat: number, zoom: number) => TileIndex | 计算覆盖某坐标的瓦行列；经度跨反经线回绕，纬度钳制到 ±85.05112878 |
| tileToLngLatBounds | (index: TileIndex) => TileBounds | 计算瓦片的西/北/东/南边界（度） |
| tileToCorners | (index: TileIndex) => TileCorners | 计算瓦片的 NW/NE/SE/SW 四角坐标 |
| selectTiles | (points: GeoPoint[], zoom: number) => TileIndex[] | 返回与点集包围矩形相交的全部瓦片 |
| selectTilesInBounds | (west: number, south: number, east: number, north: number, zoom: number, padding?: number) => TileIndex[] | 返回与西/南/东/北矩形相交的全部瓦片，并按 `padding` 圈外扩；跨反经线安全 |
| tileUrl | (template: string, index: TileIndex, subdomains?: string[]) => string | 展开 `{s}`/`{z}`/`{x}`/`{y}` 占位符 |

## 事件

| 名称 | 参数 | 描述 |
|------|------|------|
| onReady | (group: THREE.Group) => void | 图层组添加到场景后触发一次 |
| onTileError | (index: TileIndex, url: string) => void | 某张瓦片图片下载失败时触发 |
