---
lang: en-US
title: Water
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Water from '@site/src/components/effects/Water'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

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

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| sunDirection | Vector3 \| [number, number, number] | [-0.58, 0.1, -0.81] | Direction from the water surface towards the sun |
| captureResolution | number | 512 | Longest edge of the planar reflection and refraction captures, in device pixels |
| segments | number | 240 | Plane subdivisions per axis |
| size | number | 420 | Size of the water patch, in world units |

## Renderer Support

The water is shaded with TSL and runs on both renderers:

- **WebGPU** uses the `reflector()` node for planar reflection and `viewportSharedTexture()` for refraction, both handled by the render graph.
- **WebGL** renders a mirrored planar reflection and a refraction capture of the scene (water excluded) into half float render targets every frame, then samples them in the water shader.

Captures are sized from the drawing buffer, clamped between 14% and 42% of its longest edge and scaled by `captureResolution`. When the camera drops below the animated surface, the water shades its underside and the planar captures are skipped until the camera rises again.
