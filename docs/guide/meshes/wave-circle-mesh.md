---
lang: en-US
title: Wave Circle Mesh
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaveCircleMesh from '@site/src/components/meshes/WaveCircleMesh'
import WaveCircleMeshOptions from '@site/src/components/meshes/WaveCircleMeshOptions'

## Type

Class

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare. The mesh automatically detects the renderer from the scene it is added to, so the color looks identical on both backends.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaveCircleMesh />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
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

    export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
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

## Custom Options

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaveCircleMeshOptions />

    ```tsx
    import { useRef } from 'react'
    import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
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

    export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
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

## Constructor Parameters

| Paramter | Props        | Type                             | Default              | Description                                                                       |
| -------- | ------------ | -------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| options  | radius       | number                           | 1                    | `optional` The radius of the wave circle.                                         |
|          | color        | [number, number, number, number] | [0.52, 0.78, 0.8, 1] | `optional` The color of the wave circle.                                          |
|          | speed        | number                           | 1                    | `optional` The speed of the circle wave.                                          |
|          | verticalAxis | AxisType                         | AxisType.Y           | `optional` The circle face vertical axis. The type AxisType is `X` or `Y` or `Z`. |
