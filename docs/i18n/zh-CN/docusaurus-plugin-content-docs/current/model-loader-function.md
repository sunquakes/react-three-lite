---
title: 函数加载器
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import GLTFLoaderFunction from '@site/src/components/GLTFLoaderFunction'
import FBXLoaderFunction from '@site/src/components/FBXLoaderFunction'
import OBJLoaderFunction from '@site/src/components/OBJLoaderFunction'

## 类型

函数

## GLTF 加载器

### 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <GLTFLoaderFunction rendererType="webgpu" />

    ```tsx
    import { Scene, GLTFLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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
    <GLTFLoaderFunction rendererType="webgl" />

    ```tsx
    import { Scene, GLTFLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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

### 参数

| 名称             | 类型     | 默认值                                                       | 描述                                                                                                 |
| ---------------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| url              | string   |                                                              | `必需` 模型的 URL。                                                                                  |
| useDraco         | boolean  | false                                                        | `可选` 是否使用 Draco 解码器。Draco 压缩的 GLTF 模型需设为 `true`。                                   |
| dracoDecoderPath | string   | `https://www.gstatic.com/draco/versioned/decoders/1.5.7/`   | `可选` Draco 解码器路径。仅在 `useDraco` 为 `true` 时需要。                                           |
| cache            | boolean  | true                                                         | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。                                                  |
| onProgress       | function |                                                              | `可选` 模型加载进度的回调函数。                                                                      |

## FBX 加载器

### 默认用法

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <FBXLoaderFunction rendererType="webgpu" />

    ```tsx
    import { Scene, FBXLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await FBXLoaderAsync('/models/perseverance.fbx')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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
    <FBXLoaderFunction rendererType="webgl" />

    ```tsx
    import { Scene, FBXLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await FBXLoaderAsync('/models/perseverance.fbx')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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

### 参数

| 名称       | 类型     | 默认值  | 描述                                                                                                 |
| ---------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| url        | string   |         | `必需` 模型的 URL。                                                                                  |
| cache      | boolean  | true    | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。                                                  |
| onProgress | function |         | `可选` 模型加载进度的回调函数。                                                                      |

## OBJ 加载器

### 默认用法

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <OBJLoaderFunction rendererType="webgpu" />

    ```tsx
    import { Scene, OBJLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await OBJLoaderAsync('/models/obj/perseverance.obj', '/models/obj/perseverance.mtl')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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
    <OBJLoaderFunction rendererType="webgl" />

    ```tsx
    import { Scene, OBJLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // 加载模型到场景
        const model = await OBJLoaderAsync('/models/obj/perseverance.obj', '/models/obj/perseverance.mtl')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

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

### 参数

| 名称       | 类型     | 默认值  | 描述                                                                                                 |
| ---------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| url        | string   |         | `必需` 模型的 URL。                                                                                  |
| mtlUrl     | string   |         | `可选` 模型的材质 URL。只有 `OBJLoader` 需要此参数。                                                 |
| cache      | boolean  | true    | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。                                                  |
| onProgress | function |         | `可选` 模型加载进度的回调函数。                                                                      |
