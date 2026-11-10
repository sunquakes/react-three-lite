---
title: 互动水池
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaterPool from '@site/src/components/effects/WaterPool'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPool />

    ```tsx
    import * as THREE from 'three'
    import { Scene, WaterPool } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(1.25, 0.9, 1.7)
        controls.target.set(0, -0.15, 0)
        camera.lookAt(0, -0.15, 0)
      }

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPool rendererType="webgl" />

    ```tsx
    import * as THREE from 'three'
    import { Scene, WaterPool } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(1.25, 0.9, 1.7)
        controls.target.set(0, -0.15, 0)
        camera.lookAt(0, -0.15, 0)
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
          <WaterPool />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

在水池内拖动可以产生涟漪，拖动方块可以推动它，在水池外拖动可以旋转相机。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| resolution | number | 128 | 每轴高度场网格数量，限制在 8–512 |
| segments | number | 160 | 沿不规则池壁轮廓的细分数 |
| boxes | `{ position: [number, number, number]; size: [number, number, number]; color?: string }[]` | 三个方块 | 漂浮在水池中的不同形状方块 |
| sunDirection | Vector3 \| [number, number, number] | [0.55, 0.9, 0.35] | 从水池指向太阳的方向 |
| autoRipples | boolean | true | 每 1.8 秒自动产生一个随机涟漪 |
| interactive | boolean | true | 允许拖动水面与方块 |
| sky | boolean | true | 在水池后方绘制程序化天空穹顶 |

`boxes` 的每一项描述一个方块：`position` 是中心位置，`size` 是完整尺寸，`color` 是可选的 CSS 颜色。每个方块都会参与水面的射线追踪，因此方块越多着色器开销越大，少量形状即可保持流畅。

## 实现原理

本组件是 [Evan Wallace 的 webgl-water](https://madebyevan.com/webgl-water/) 的移植版本，只是把浮球换成了各种形状的方块。

- CPU 高度场按网格保存 `(高度, 速度, 法线.x, 法线.z)`，并运行与原版一致的两次波动方程迭代。数据以 RGBA 半浮点 `DataTexture` 上传，在顶点节点中位移水面。
- 焦散贴图通过把每个水面网格沿折射后的太阳光线投影到池底生成。投影的局部压缩会把光线聚集，因此焦散贴图按水面坐标索引，池底像素再按自己的太阳光线入射点进行采样。
- 水面、不规则的瓷砖池壁与方块均在 TSL 中用解析射线着色：水面反射并折射方块、池壁与程序化天空，池底接收动态焦散，每个方块还会投下柔和阴影。
- 方块在水中移动时，会按其底面轮廓位移高度场，因此拖动方块会留下扩散的尾迹。
- 模拟使用固定 1/60 秒的时间累加器，每帧最多补算三步，因此涟漪在任何刷新率下表现一致。

## 渲染器支持

所有着色均使用 TSL 节点材质，两种渲染器均可运行：

- **WebGPU** 通过 `WebGPURenderer` 直接执行节点图。
- **WebGL** 通过 `WebGLNodesHandler` 将同一份 TSL 节点图编译为 GLSL。

池壁、方块与天空都在着色器内进行射线追踪，而不是从场景中捕获，因此不涉及渲染目标，两种后端输出一致。
