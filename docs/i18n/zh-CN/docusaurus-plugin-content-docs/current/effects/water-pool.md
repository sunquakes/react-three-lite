---
title: 互动水池
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaterPool from '@site/src/components/effects/WaterPool'
import WaterPoolIrregular from '@site/src/components/effects/WaterPoolIrregular'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPool />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components

        // 太阳角度高一些焦散更清晰；所有效果共用这个方向。
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

        camera.position.set(1.5, 1.1, 2.0)
        controls.target.set(0, -0.1, 0)
        camera.lookAt(0, -0.1, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        // 模型尺寸为 0.86 x 0.53 x 1.64，缸底位于 y = 0。
        // 盖住 2 x 2 的水面并向下移动 1 个单位：缸沿刚好高于水面，
        // 水一直贴到缸壁，不会留下干边。
        tub.scale.set(2.7, 1.92, 1.28)
        tub.position.set(0, -1, 0)
        scene.add(tub)
        tubRef.current = tub
      }

      // 卸载时清理
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

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
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.5, 1.1, 2.0)
        controls.target.set(0, -0.1, 0)
        camera.lookAt(0, -0.1, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        // 模型尺寸为 0.86 x 0.53 x 1.64，缸底位于 y = 0。
        // 盖住 2 x 2 的水面并向下移动 1 个单位：缸沿刚好高于水面，
        // 水一直贴到缸壁，不会留下干边。
        tub.scale.set(2.7, 1.92, 1.28)
        tub.position.set(0, -1, 0)
        scene.add(tub)
        tubRef.current = tub
      }

      // 卸载时清理
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

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

水面外围的浴缸是一个用 `GLTFLoaderAsync` 加载的浴缸 GLB。它的尺寸为 0.86 × 0.53 × 1.64 个单位，缸底位于 `y = 0`，因此示例把它拉伸到 2 × 2 的水面并向下移动 1 个单位。浴缸比水面开口略小一点：内壁稍微切入水面，缸沿刚好高出水面，因此水在四周都贴住缸壁，不会留下干边。该模型只用于显示 —— 着色器仍然只追踪池底与天空，因此着色开销不变。

## 自定义形状

通过 `shape` 传入轮廓或任意 `THREE.BufferGeometry` 即可替换方形水池。轮廓点是 XZ 平面上的 `[x, z]` 坐标，几何体的顶点会投影到 XZ 平面，两者都会先取凸包。轮廓必须包含原点且位于 -1…1 范围内，涟漪与焦散才能覆盖整个水面。

这个示例把水放进下载的转角浴缸里，而不是方形浴缸。下面的轮廓就是浴缸缸沿的俯视形状 —— 方形的靠背加上一段弧形前沿 —— 因此水面会一直填到缸沿，水池本身也按模型缩放并抬升到缸内。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPoolIrregular />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 浴缸尺寸为 1.2 x 1.2，缸底位于 y = 0，缸沿位于 0.55。
    const TUB_SCALE = 1.5
    const WATER_Y = 0.55 * TUB_SCALE - 0.02

    // 转角浴缸缸沿的俯视轮廓：方形的靠背加一段弧形前沿。
    // 水面使用同一轮廓，因此四周都能贴到缸沿。
    const TUB_OUTLINE: [number, number][] = [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.59, -0.443],
      [0.559, -0.289],
      [0.509, -0.141],
      [0.439, 0],
      [0.352, 0.131],
      [0.249, 0.249],
      [0.131, 0.352],
      [0, 0.439],
      [-0.141, 0.509],
      [-0.289, 0.559],
      [-0.443, 0.59],
      [-0.6, 0.6]
    ]

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.6, 1.4, 1.9)
        controls.target.set(0, 0.35, 0)
        camera.lookAt(0, 0.35, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub-corner.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        tub.scale.setScalar(TUB_SCALE)
        scene.add(tub)
        tubRef.current = tub
      }

      // 卸载时清理
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={TUB_SCALE} position={[0, WATER_Y, 0]} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPoolIrregular rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 浴缸尺寸为 1.2 x 1.2，缸底位于 y = 0，缸沿位于 0.55。
    const TUB_SCALE = 1.5
    const WATER_Y = 0.55 * TUB_SCALE - 0.02

    // 转角浴缸缸沿的俯视轮廓：方形的靠背加一段弧形前沿。
    // 水面使用同一轮廓，因此四周都能贴到缸沿。
    const TUB_OUTLINE: [number, number][] = [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.59, -0.443],
      [0.559, -0.289],
      [0.509, -0.141],
      [0.439, 0],
      [0.352, 0.131],
      [0.249, 0.249],
      [0.131, 0.352],
      [0, 0.439],
      [-0.141, 0.509],
      [-0.289, 0.559],
      [-0.443, 0.59],
      [-0.6, 0.6]
    ]

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.6, 1.4, 1.9)
        controls.target.set(0, 0.35, 0)
        camera.lookAt(0, 0.35, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub-corner.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        tub.scale.setScalar(TUB_SCALE)
        scene.add(tub)
        tubRef.current = tub
      }

      // 卸载时清理
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={TUB_SCALE} position={[0, WATER_Y, 0]} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

浴缸是一个转角浴缸 GLB（1.2 × 1.2，缸底位于 `y = 0`，缸沿位于 `y = 0.55`），整体放大 1.5 倍。`TUB_OUTLINE` 就是它缸沿的俯视轮廓，因此 `shape` 让水面覆盖整个缸体；水池被抬升到 `WATER_Y`，其深度落到缸底以下，由模型挡住。缸沿遮住水池侧壁，看上去水装到了缸沿。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| resolution | number | 128 | 每轴高度场网格数量，限制在 8–512 |
| shape | `'box' \| [number, number][] \| THREE.BufferGeometry` | `'box'` | 容器轮廓：`'box'` 为方形水池，或 -1…1 范围内的 `[x, z]` 点，或顶点投影到 XZ 平面的几何体（如 `ConvexGeometry`） |
| segments | number | 160 | 沿容器轮廓的细分数 |
| boxes | `{ position: [number, number, number]; size: [number, number, number]; color?: string }[]` | 三个方块 | 漂浮在水池中的不同形状方块 |
| autoRipples | boolean | true | 每 1.8 秒自动产生一个随机涟漪 |
| interactive | boolean | true | 允许拖动水面与方块 |
| sky | boolean | true | 在水池后方绘制程序化天空穹顶 |
| position | Vector3 \| [number, number, number] | [0, 0, 0] | 水面的世界坐标中心位置 |
| scale | number | 1 | 水池整体的统一缩放：占地、深度与漂浮方块 |

太阳方向通过[全局参数总线](/zh-CN/guide/effects/global-parameters)共享，不再是属性，因此焦散与天空、海面使用同一个太阳：

```ts
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

水池在自身坐标系中建模：水面中心为原点，轮廓位于 -1…1 范围内，池底在水面下方 1 个单位处。`position` 与 `scale` 把整个坐标系放到场景中，因此 `scale` 为 `3` 时水池宽 6 个世界单位、池深 3 个单位，漂浮方块也会一起放大。

`boxes` 的每一项描述一个方块：`position` 是中心位置，`size` 是完整尺寸，`color` 是可选的 CSS 颜色。每个方块都会参与水面的射线追踪，因此方块越多着色器开销越大，少量形状即可保持流畅。
