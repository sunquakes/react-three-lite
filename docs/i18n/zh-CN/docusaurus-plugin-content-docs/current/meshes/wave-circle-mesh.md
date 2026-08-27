---
title: 波浪圆环网格
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaveCircleMesh from '@site/src/components/meshes/WaveCircleMesh'
import WaveCircleMeshOptions from '@site/src/components/meshes/WaveCircleMeshOptions'

## 类型

类

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。网格会根据其所属场景上的渲染器自动判断，两端渲染器下的颜色保持一致。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaveCircleMesh />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function WaveCircleMeshComponent({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      const sceneRef = useRef<THREE.Scene>()

      const handleCreated = (scene: THREE.Scene, { camera }: SceneComponents) => {
        sceneRef.current = scene
        camera.position.set(0, 2, 0)

        const mesh = new WaveCircleMesh()
        scene.add(mesh)
      }

      return (
        <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
          <Scene rendererType={rendererType} onCreated={handleCreated} />
        </div>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaveCircleMesh rendererType="webgl" />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function WaveCircleMeshComponent({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      const sceneRef = useRef<THREE.Scene>()

      const handleCreated = (scene: THREE.Scene, { camera }: SceneComponents) => {
        sceneRef.current = scene
        camera.position.set(0, 2, 0)

        const mesh = new WaveCircleMesh()
        scene.add(mesh)
      }

      return (
        <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
          <Scene rendererType={rendererType} onCreated={handleCreated} />
        </div>
      )
    }
    ```
  </TabItem>
</Tabs>

## 自定义选项

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaveCircleMeshOptions />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function WaveCircleMeshOptionsComponent({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      const sceneRef = useRef<THREE.Scene>()

      const handleCreated = (scene: THREE.Scene, { camera }: SceneComponents) => {
        sceneRef.current = scene
        camera.position.set(2, 0, 0)

        const mesh = new WaveCircleMesh({
          radius: 0.5,
          color: [0.98, 0.61, 0.6, 1],
          speed: 2,
          verticalAxis: AxisType.X
        })
        scene.add(mesh)
        mesh.position.set(0, 0.5, 0)
      }

      return (
        <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
          <Scene rendererType={rendererType} onCreated={handleCreated} />
        </div>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaveCircleMeshOptions rendererType="webgl" />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function WaveCircleMeshOptionsComponent({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      const sceneRef = useRef<THREE.Scene>()

      const handleCreated = (scene: THREE.Scene, { camera }: SceneComponents) => {
        sceneRef.current = scene
        camera.position.set(2, 0, 0)

        const mesh = new WaveCircleMesh({
          radius: 0.5,
          color: [0.98, 0.61, 0.6, 1],
          speed: 2,
          verticalAxis: AxisType.X
        })
        scene.add(mesh)
        mesh.position.set(0, 0.5, 0)
      }

      return (
        <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
          <Scene rendererType={rendererType} onCreated={handleCreated} />
        </div>
      )
    }
    ```
  </TabItem>
</Tabs>

## 构造函数参数

| 参数    | 属性          | 类型                             | 默认值              | 描述                                                    |
| ------- | ------------ | -------------------------------- | -------------------- | ------------------------------------------------------- |
| options | radius       | number                           | 1                    | `可选` 波动圆的半径。                                   |
|         | color        | [number, number, number, number] | [0.52, 0.78, 0.8, 1] | `可选` 波动圆的颜色。                                   |
|         | speed        | number                           | 1                    | `可选` 圆波动的速度。                                   |
|         | verticalAxis | AxisType                         | AxisType.Y           | `可选` 圆面垂直轴。AxisType 类型是 `X`、`Y` 或 `Z`。    |
