---
lang: en-US
title: Function Loader
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import GLTFLoaderFunction from '@site/src/components/GLTFLoaderFunction'
import FBXLoaderFunction from '@site/src/components/FBXLoaderFunction'
import OBJLoaderFunction from '@site/src/components/OBJLoaderFunction'

## Type

Function

## GLTF Loader

### Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <GLTFLoaderFunction />

    ```tsx
    import { Scene, GLTFLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // Load model to scene.
        const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

      return (
        <Scene 
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

        // Load model to scene.
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

### Parameters

| Name             | Type     | Default                                                    | Description                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| url              | string   |                                                            | `required` The model url.                                                                                   |
| useDraco         | boolean  | false                                                      | `optional` Whether to use Draco decoder. Set to `true` for Draco-compressed GLTF models.                    |
| dracoDecoderPath | string   | `https://www.gstatic.com/draco/versioned/decoders/1.5.7/` | `optional` The Draco decoder path. Only needed when `useDraco` is `true`.                                   |
| cache            | boolean  | true                                                       | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress       | function |                                                            | `optional` The callback function when loading the model.                                                    |

## FBX Loader

### Default Usage

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <FBXLoaderFunction />

    ```tsx
    import { Scene, FBXLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // Load model to scene.
        const model = await FBXLoaderAsync('/models/perseverance.fbx')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

      return (
        <Scene 
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

        // Load model to scene.
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

### Parameters

| Name       | Type     | Default | Description                                                                                                 |
| ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| url        | string   |         | `required` The model url.                                                                                   |
| cache      | boolean  | true    | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress | function |         | `optional` The callback function when loading the model.                                                    |

## OBJ Loader

### Default Usage

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <OBJLoaderFunction />

    ```tsx
    import { Scene, OBJLoaderAsync } from 'react-three-lite'
    import type * as THREE from 'three'

    function App() {
      const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
        camera.position.set(0, 1.5, 3)
        camera.lookAt(0, 0, 0)

        // Load model to scene.
        const model = await OBJLoaderAsync('/models/obj/perseverance.obj', '/models/obj/perseverance.mtl')
        model.scale.set(0.8, 0.8, 0.8)
        scene.add(model)
      }

      return (
        <Scene 
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

        // Load model to scene.
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

### Parameters

| Name       | Type     | Default | Description                                                                                                 |
| ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| url        | string   |         | `required` The model url.                                                                                   |
| mtlUrl     | string   |         | `optional` The model material url. Only `OBJLoader` needs this parameter.                                   |
| cache      | boolean  | true    | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress | function |         | `optional` The callback function when loading the model.                                                    |
