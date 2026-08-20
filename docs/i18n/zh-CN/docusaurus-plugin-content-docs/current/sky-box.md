---
title: 天空盒
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SkyBoxComponent from '@site/src/components/SkyBox'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SkyBoxComponent rendererType="webgpu" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import { Scene, SkyBox } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function SkyBoxComponent() {
      const skyBoxRef = useRef<SkyBox | null>(null)

      const handleCreated = (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        if (camera) {
          camera.position.set(0, 1.5, 3)
        }

        const skyBox = new SkyBox([
          '/images/examples/skybox/right.jpg',
          '/images/examples/skybox/left.jpg',
          '/images/examples/skybox/top.jpg',
          '/images/examples/skybox/bottom.jpg',
          '/images/examples/skybox/front.jpg',
          '/images/examples/skybox/back.jpg'
        ])
        skyBoxRef.current = skyBox
        scene.background = skyBox.scene
      }

      useEffect(() => {
        return () => {
          skyBoxRef.current?.scene.dispose()
          skyBoxRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgpu"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
          onCreated={handleCreated}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SkyBoxComponent rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import { Scene, SkyBox } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function SkyBoxComponent() {
      const skyBoxRef = useRef<SkyBox | null>(null)

      const handleCreated = (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        if (camera) {
          camera.position.set(0, 1.5, 3)
        }

        const skyBox = new SkyBox([
          '/images/examples/skybox/right.jpg',
          '/images/examples/skybox/left.jpg',
          '/images/examples/skybox/top.jpg',
          '/images/examples/skybox/bottom.jpg',
          '/images/examples/skybox/front.jpg',
          '/images/examples/skybox/back.jpg'
        ])
        skyBoxRef.current = skyBox
        scene.background = skyBox.scene
      }

      useEffect(() => {
        return () => {
          skyBoxRef.current?.scene.dispose()
          skyBoxRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
          onCreated={handleCreated}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 属性

| 名称  | 类型              | 描述                                                |
| ----- | ----------------- | --------------------------------------------------- |
| scene | THREE.CubeTexture | 用于 THREE.Scene 背景的立方体纹理。                 |

## 方法

| 名称        | 参数                 | 描述                                           |
| ----------- | -------------------------- | --------------------------------------------- |
| constructor | (images: string[]) => void | `images` 包含六张图片，分别是立方体的右、左、上、下、前、后。 |
