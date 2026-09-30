---
lang: zh-CN
title: 地理参考系
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import App from '@site/src/components/gis/GeoReference'

## 类型

类 + Scene 配置项

## 概念

`GeoReference` 将坐标参考系、大地基准面和轴约定绑定到一个固定的**局部原点**。转换链路如下：

```text
地理坐标 (lng, lat, alt)
  -> 基准面归一化到 WGS84
  -> 局部切平面（float64 米制）
  -> 围绕局部原点重新中心化
  -> ENU -> three.js 轴映射（东:+X，北:-Z，上:+Y）
  -> THREE.Vector3（float32）
```

局部原点保证了场景坐标始终很小。Web Mercator 的绝对坐标约为 1.3e7 米，直接使用 three.js 的 float32 坐标在城市场景中会产生明显抖动；重新中心化后，所有物体都位于距 `(0, 0, 0)` 几公里以内。

每个 Scene 都存在一个 `GeoReference`。不传入任何 GIS 配置时，它使用以 `(0, 0)` 为中心的 WGS84/等距圆柱默认值，对普通的非地理场景是完全无副作用的空操作，因此该功能是完全可选的。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

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
          const geometry = new THREE.SphereGeometry(radius, 24, 16)
          const material = new THREE.MeshBasicMaterial({ color })
          const marker = new THREE.Mesh(geometry, material)
          // 参考系已绑定在 scene 上，由 scene 自己完成投影。
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
          const geometry = new THREE.SphereGeometry(radius, 24, 16)
          const material = new THREE.MeshBasicMaterial({ color })
          const marker = new THREE.Mesh(geometry, material)
          // 参考系已绑定在 scene 上，由 scene 自己完成投影。
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

## Scene 配置项

| 属性   | 类型                           | 默认值                                | 描述                                                         |
| ------ | ------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| origin | GeoPoint                       | `{ lng: 0, lat: 0, alt: 0 }`          | 局部切平面原点，所有场景坐标都相对于它                       |
| crs    | `'EPSG:4326' \| 'EPSG:3857'`   | `'EPSG:4326'`                         | 平面模型：等距圆柱切平面或重新中心化的 Web Mercator          |
| datum  | `'WGS84' \| 'GCJ02' \| 'BD09'` | `'WGS84'`                             | 传入场景的坐标所使用的基准面                                 |
| axes   | AxesMapping                    | `{ east: 'x', north: '-z', up: 'y' }` | 将 ENU 基映射到带符号的 three.js 轴                          |
| geo    | GeoReference                   | —                                     | 直接传入预先构建的参考系，替代 `origin`/`crs`/`datum`/`axes` |

Scene 构建出的参考系可在 `onCreated(scene, components)` 回调中通过
`components.geo` 获取，也可通过 `useScene().geo` 获取。它同时会绑定到 scene
自身，因此大多数代码完全不需要显式提到 `geo`。

## 物体定位

每个 Scene 都会把自己的 `GeoReference` 绑定到 scene 实例上，并安装一个统一的
定位方法 `scene.setPosition(object, position, datum?)`。由于 scene 已经持有参考系，
定位时只需给出坐标本身，无需再把参考系传来传去；mesh、group 和 camera 都是
`THREE.Object3D`，所以同一个调用写法可以定位任意对象。

`position` 接受所有常用形态（`ScenePosition`）：

| 坐标形态 | 含义 |
| --- | --- |
| `{ lng, lat, alt? }` | 地理点，经 scene 参考系投影 |
| `[lng, lat]` | 地理点元组，高度默认 `0` |
| `[lng, lat, alt]` | 地理点元组 |
| `THREE.Vector3` | 局部米坐标，原样使用、不投影 |
| `{ x, y, z? }` | 局部米坐标对象，`z` 默认 `0` |

```ts
const handleCreated = (scene: THREE.Scene) => {
  // 下面四种都是地理坐标，统一经由 scene 自身的参考系投影。
  scene.setPosition(mesh, { lng: 116.397, lat: 39.909 })
  scene.setPosition(mesh, { lng: 116.397, lat: 39.909, alt: 35 })
  scene.setPosition(mesh, [116.397, 39.909])
  scene.setPosition(mesh, [116.397, 39.909, 35])

  // GCJ02/BD09 输入可按次传入 datum 覆盖场景的 datum。
  scene.setPosition(mesh, [116.403, 39.915], 'GCJ02')

  // 相机与 mesh 使用完全相同的调用。
  scene.setPosition(camera, [116.397428, 39.90923, 120])

  // 局部米坐标原样使用，不做投影。
  scene.setPosition(helper, new THREE.Vector3(10, 0, -5))
  scene.setPosition(helper, { x: 10, y: 0, z: -5 })
}
```

方法会返回传入的对象，支持链式调用。自行 `new THREE.Scene()` 创建的场景没有该
方法；可调用一次 `bindSceneGeo(scene, geo)` 安装，或通过 `getSceneGeo(scene)`
读取参考系。如果场景已安装方法但没有绑定参考系，地理元组/对象会回退为本地坐标，
把 `lng/lat/alt` 直接写到 `x/y/z`，因此该调用在任何场景下都是安全的。

| 辅助函数 | 签名 | 描述 |
| --- | --- | --- |
| scene.setPosition | (object: Object3D, position: ScenePosition, datum?: DatumType) => Object3D | 定位任意对象；地理输入自动投影，局部米坐标原样使用 |
| scene.getGeo | () => GeoReference \| undefined | 读取绑定在 scene 上的参考系 |
| bindSceneGeo | (scene: Scene, geo?: GeoReference) => Scene | 在 scene 上安装定位方法，并可选绑定参考系 |
| getSceneGeo | (scene: Scene) => GeoReference \| undefined | `scene.getGeo()` 的函数形式 |

## GeoReference 方法

| 名称        | 参数                                                               | 描述                         |
| ----------- | ------------------------------------------------------------------ | ---------------------------- |
| constructor | (origin?: GeoPoint, options?: GeoReferenceOptions) => GeoReference | 构建参考系及其切平面         |
| toLocal     | (p: GeoPoint, datum?: DatumType, target?: Vector3) => Vector3      | 地理坐标 -> 局部米制坐标     |
| toGeo       | (v: Vector3, datum?: DatumType, target?: GeoPoint) => GeoPoint     | 局部米制坐标 -> 地理坐标     |
| setPosition | (object: Object3D, p: GeoPoint, datum?: DatumType) => Object3D     | 将已有物体放置到指定地理位置 |
| distance    | (a: GeoPoint, b: GeoPoint, datum?: DatumType) => number            | 平面距离（米）               |

```ts
import { GeoReference } from 'react-three-lite'
import type { GeoPoint } from 'react-three-lite'

const origin: GeoPoint = { lng: 116.397, lat: 39.909 }
const geo = new GeoReference(origin, { crs: 'EPSG:4326', datum: 'WGS84' })

// 相对于原点的局部米制坐标（内部使用 float64 计算）。
const local = geo.toLocal({ lng: 116.4005, lat: 39.909 })

// 反向转换；混合多种数据源时可按次传入 datum。
const back = geo.toGeo(local)

// GCJ02（高德/腾讯）输入会被自动归一化。
const fromMars = geo.toLocal({ lng: 116.403, lat: 39.915 }, 'GCJ02')
```

## 相机取景

`fitCameraToPoints` 是一个与坐标系无关的统一取景点。它通过检查每个点的
**形状**来判断，而不需要你说明场景是不是 GIS：

- 地理点（`{ lng, lat, alt? }`）会通过 `options.geo` 投影到局部米坐标（并遵循
  `options.datum`）。
- 本地点（`THREE.Vector3` 或 `{ x, y, z? }`）则原样使用。

由于每个 Scene 都始终提供一个 `GeoReference`（对普通非地理场景是空操作），同一
次调用在两种世界中都能工作。地理点与本地点不能在同一次调用中混用（会抛错），
且地理点必须提供 `options.geo`。空数组为空操作。

```ts
import { fitCameraToPoints } from 'react-three-lite'
import { isGeoPoint } from 'react-three-lite'

// GIS 场景：自动识别 {lng, lat} 点并完成投影。
fitCameraToPoints(camera, [{ lng: 116.4, lat: 39.9 }], {
  geo,
  datum: 'WGS84',
  controls
})

// 普通场景：直接使用局部米制点，无需 geo。
fitCameraToPoints(camera, [new THREE.Vector3(-2, 0, -2), { x: 2, y: 0, z: 2 }])

isGeoPoint({ lng: 116.4, lat: 39.9 }) // true
isGeoPoint(new THREE.Vector3(0, 0, 0)) // false
```

| 函数                 | 签名                                                                          | 描述                                           |
| -------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| fitCameraToPoints    | (camera, points: FitPoint[], options?: FitPointsOptions) => PerspectiveCamera | 统一取景，自动识别地理点/本地点                |
| isGeoPoint           | (point: FitPoint) => boolean                                                  | 类型守卫：点带有 `lng`/`lat` 时为 true         |
| fitCameraToBox       | (camera, box: Box3, options?) => PerspectiveCamera                            | 对显式的局部米制包围盒取景                     |
| fitCameraToObject    | (camera, object: Object3D \| Object3D[], options?) => PerspectiveCamera       | 对物体的世界包围盒取景                         |
| fitCameraToGeoPoints | (camera, points: GeoPoint[], geo, datum?, options?) => PerspectiveCamera      | 仅地理点的旧接口，内部封装 `fitCameraToPoints` |

`FitPoint = GeoPoint | LocalPoint`，其中 `LocalPoint = THREE.Vector3 | { x, y, z? }`。

`FitPointsOptions` 在通用取景选项之上额外增加了 `geo?: GeoReference`（地理点必填）
和 `datum?: DatumType`：

| 选项       | 类型                           | 默认值                | 描述                                         |
| ---------- | ------------------------------ | --------------------- | -------------------------------------------- |
| geo        | GeoReference                   | —                     | 用于投影地理点；可通过 `components.geo` 获取 |
| datum      | `'WGS84' \| 'GCJ02' \| 'BD09'` | GeoReference 的 datum | 地理输入所使用的基准面                       |
| elevation  | number                         | `PI/4`                | 俯仰角（弧度）；`PI/2` 为正俯视              |
| azimuth    | number                         | `PI/4`                | 相对正北（-Z）顺时针的相机方位角             |
| padding    | number                         | `1.4`                 | 距离倍数；>1 留出边距                        |
| distance   | number                         | 自动计算              | 覆盖计算出的距离（米）                       |
| adjustClip | boolean                        | `true`                | 根据内容尺度推导近/远裁剪面                  |
| controls   | OrbitControls                  | —                     | 将控制器目标同步到包围盒中心                 |

### FitCamera

`FitCamera` 可以直接替换你原本通过 `<Scene camera={...} />` 传入的相机。它继承自
`THREE.PerspectiveCamera`，构造参数完全相同，`position` 也是普通的原生向量，因此 Scene
的默认相机创建逻辑和 `camera` 传参保持不变——`FitCamera` 只是一个可选的、由你自行传入的
相机。定位方式与其他任何对象完全一致：交给 scene 来放置。

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
    // 与锚定 mesh 完全相同的 scene 调用，元组会自动经 scene 参考系投影。
    scene.setPosition(camera, [116.397428, 39.90923, 120])
    controls?.target.set(0, 0, 0)
    controls?.update()
  }

  return <Scene camera={cameraRef.current} onCreated={handleCreated} />
}
```

`camera.position` 始终是普通的 `THREE.Vector3`，OrbitControls 用到的向量运算
（`copy`、`add`、`sub`、`addScaledVector` 等）以及局部米坐标的
`position.set(x, y, z)` 行为都与之前完全一致——非 GIS 场景没有任何额外概念需要学习。
只有当你显式地把地理点交给 `scene.setPosition` 时才会发生投影。

需要自动取景时，相机也可以直接持有上文的取景操作，而不必每次都把
`camera`/`geo`/`controls` 传一遍。所有方法都返回 `this`，支持链式调用。

```ts
// 地理点使用已绑定的 geo（单次调用仍可传入 datum/geo 覆盖）。
camera.fitToPoints(
  [
    { lng: 116.397428, lat: 39.90923 },
    { lng: 116.4005, lat: 39.9117 }
  ],
  { datum: 'WGS84', azimuth: Math.PI }
)

// 局部米制点、物体和显式包围盒无需绑定即可使用。
camera.fitToPoints([new THREE.Vector3(-2, 0, -2), { x: 2, y: 0, z: 2 }])
camera.fitToObject(mesh, { padding: 1.2 })
camera.fitToObject([mesh1, mesh2])
camera.fitToBox(new THREE.Box3().setFromObject(group))
```

构造参数与 `THREE.PerspectiveCamera` 一致，默认为
`(fov = 75, aspect = 1, near = 0.1, far = 1000)`，初始位置与 Scene 默认相机一样为
`(0, 0, 1)`；当相机由 Scene 持有时，尺寸同步逻辑会在挂载时以及容器尺寸变化时把 `aspect`
同步为容器宽高比。

| 方法        | 签名                                                                      | 描述                                                                                                       |
| ----------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| constructor | (fov?: number, aspect?: number, near?: number, far?: number) => FitCamera | 参数与 `THREE.PerspectiveCamera` 相同                                                                      |
| bind        | (geo?: GeoReference \| null, controls?: OrbitControls \| null) => this    | 为后续 `fitTo*` 调用绑定引用。只更新显式传入的参数，传 `null` 可清除绑定 |
| fitToPoints | (points: FitPoint[], options?: FitCameraOptions) => this                  | 对点取景；自动判别地理点 `{lng, lat}` 与局部米制点                                                         |
| fitToObject | (object: Object3D \| Object3D[], options?: CameraFitOptions) => this      | 对一个或多个物体的世界空间包围盒取景                                                                       |
| fitToBox    | (box: Box3, options?: CameraFitOptions) => this                           | 对显式的局部米制包围盒取景                                                                                 |

`FitCameraOptions` 在通用取景选项集之上增加了可选的 `geo` 和 `datum`，因此任意字段都可以在
单次调用时传入并覆盖已绑定的值；单次调用传入的 `controls` 同样会覆盖已绑定的控制器。

## 基准面工具函数

国内地图服务使用加密基准面；若不转换就与原始 GPS（WGS84）数据混用，在中国境内会产生 50–600 米的偏移。

| 函数                        | 签名                                                      | 描述                     |
| --------------------------- | --------------------------------------------------------- | ------------------------ |
| toWGS84                     | (p: GeoPoint, from: DatumType) => GeoPoint                | 将 GCJ02/BD09 转为 WGS84 |
| fromWGS84                   | (p: GeoPoint, to: DatumType) => GeoPoint                  | 将 WGS84 转为 GCJ02/BD09 |
| convertDatum                | (p: GeoPoint, from: DatumType, to: DatumType) => GeoPoint | 任意基准面之间互转       |
| wgs84ToGcj02 / gcj02ToWgs84 | (p: GeoPoint) => GeoPoint                                 | WGS84 与 GCJ02 直接互转  |
| gcj02ToBd09 / bd09ToGcj02   | (p: GeoPoint) => GeoPoint                                 | GCJ02 与 BD09 直接互转   |

GCJ02 -> WGS84 的反解采用定点迭代；BD09 闭式反解存在几厘米的固有残差。

## 投影工具函数

| 函数                           | 描述                                          |
| ------------------------------ | --------------------------------------------- |
| mercatorProject(p)             | EPSG:4326 经纬度 -> EPSG:3857 Web Mercator 米 |
| mercatorUnproject(v)           | EPSG:3857 米 -> EPSG:4326 经纬度              |
| createLocalPlane(code, origin) | 为任一 CRS 构建重新中心化的 `LocalPlane`      |
