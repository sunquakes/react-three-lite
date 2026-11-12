---
title: 海洋水面
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Water from '@site/src/components/effects/Water'
import WaterShape from '@site/src/components/effects/WaterShape'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Water />

    ```tsx
    import * as THREE from 'three'
    import { Scene, Water } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1.5, 3)
      }

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <Water />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Water rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, Water } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1.5, 3)
      }

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <Water />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 自定义形状

传入 `shape` 即可把方形水面替换为任意不规则轮廓。点是以**世界单位**表示的 `[x, z]` 坐标，也可以传入 `ConvexGeometry` 等 `THREE.BufferGeometry`，其顶点会被投影到 XZ 平面。两种输入都会取凸包，且轮廓必须包含原点，`position` 决定水面的中心位置。边界顶点由轮廓采样得到，内部顶点则是轮廓向中心缩放的结果，因此波浪着色与平面捕获都无需改动。设置 `shape` 后 `size` 不再生效，`segments` 表示边界上的总细分预算。

下面的示例把水面裁成不规则湖泊，水面的边缘就是湖岸，而不是远在视野之外的方形边界。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterShape />

    ```tsx
    import * as THREE from 'three'
    import { Scene, Water } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 不规则湖岸轮廓，世界单位，位于 XZ 平面并围绕原点。
    const LAKE_OUTLINE: [number, number][] = [
      [-8, -2.5],
      [-4.5, -5.5],
      [1.5, -6],
      [6.5, -3.5],
      [8, 1],
      [4.5, 5],
      [-1.5, 5.5],
      [-6.5, 3]
    ]

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(0, 6, 15)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <Water shape={LAKE_OUTLINE} segments={160} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterShape rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, Water } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 不规则湖岸轮廓，世界单位，位于 XZ 平面并围绕原点。
    const LAKE_OUTLINE: [number, number][] = [
      [-8, -2.5],
      [-4.5, -5.5],
      [1.5, -6],
      [6.5, -3.5],
      [8, 1],
      [4.5, 5],
      [-1.5, 5.5],
      [-6.5, 3]
    ]

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(0, 6, 15)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)
      }

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <Water shape={LAKE_OUTLINE} segments={160} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| captureResolution | number | 512 | 平面反射与折射捕获的最长边像素数 |
| segments | number | 240 | 平面每轴细分数；设置 `shape` 后表示边界总细分预算 |
| size | number | 420 | 水面平面尺寸（世界单位）；设置 `shape` 后忽略 |
| shape | `[number, number][] \| THREE.BufferGeometry` | - | 世界单位的凸轮廓，用于替换方形水面，必须包含原点 |
| position | Vector3 \| [number, number, number] | [0, 0, 0] | 水面的世界坐标中心位置 |

太阳方向不再是属性，而是从[全局参数总线](/zh-CN/guide/effects/global-parameters)读取，因此天空、水面与水池共用同一个太阳。每个场景只需设置一次：

```ts
globalParameterBus.set('sunDirection', new THREE.Vector3(-0.58, 0.1, -0.81))
```

## 渲染器支持

水面着色使用 TSL 编写，两种渲染器均可运行：

- **WebGPU** 使用 `reflector()` 节点实现平面反射，使用 `viewportSharedTexture()` 实现折射，全部交由渲染图处理。
- **WebGL** 每帧将镜像相机渲染的平面反射，以及隐藏水面后的场景折射，渲染到半浮点渲染目标，再在水面着色器中采样。

捕获分辨率按绘制缓冲区尺寸计算，限定在最长边的 14% 到 42% 之间，并受 `captureResolution` 缩放。当相机低于动态水面时，水面会着色其背面，并暂停平面捕获，直到相机重新回到水面之上。
