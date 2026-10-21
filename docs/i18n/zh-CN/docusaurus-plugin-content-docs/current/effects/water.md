---
title: 海洋水面
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Water from '@site/src/components/effects/Water'

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

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sunDirection | Vector3 \| [number, number, number] | [-0.58, 0.1, -0.81] | 从水面指向太阳的方向 |
| captureResolution | number | 512 | 平面反射与折射捕获的最长边像素数 |
| segments | number | 240 | 平面每轴细分数 |
| size | number | 420 | 水面平面尺寸（世界单位） |

## 渲染器支持

水面着色使用 TSL 编写，两种渲染器均可运行：

- **WebGPU** 使用 `reflector()` 节点实现平面反射，使用 `viewportSharedTexture()` 实现折射，全部交由渲染图处理。
- **WebGL** 每帧将镜像相机渲染的平面反射，以及隐藏水面后的场景折射，渲染到半浮点渲染目标，再在水面着色器中采样。

捕获分辨率按绘制缓冲区尺寸计算，限定在最长边的 14% 到 42% 之间，并受 `captureResolution` 缩放。当相机低于动态水面时，水面会着色其背面，并暂停平面捕获，直到相机重新回到水面之上。
