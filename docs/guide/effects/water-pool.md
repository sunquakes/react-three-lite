---
id: water-pool
lang: en-US
title: Water Pool
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaterPool from '@site/src/components/effects/WaterPool'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

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

Drag inside the pool to add ripples, drag a box to push it around, and drag outside the pool to orbit the camera.

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| resolution | number | 128 | Height-field cells per axis, clamped to 8–512 |
| segments | number | 160 | Subdivisions along the irregular pool outline |
| boxes | `{ position: [number, number, number]; size: [number, number, number]; color?: string }[]` | Three cubes | Cubes of different shapes floating in the pool |
| sunDirection | Vector3 \| [number, number, number] | [0.55, 0.9, 0.35] | Direction from the pool towards the sun |
| autoRipples | boolean | true | Adds a small random ripple every 1.8 seconds |
| interactive | boolean | true | Enables dragging the water surface and the boxes |
| sky | boolean | true | Draws the procedural sky dome behind the pool |

Each entry of `boxes` describes one block: `position` is its center, `size` its full dimensions and `color` an optional CSS color. Every box is ray traced by the water shader, so adding boxes increases the shader cost; a handful of shapes keeps the effect fast.

## How It Works

This component is a port of [Evan Wallace's webgl-water](https://madebyevan.com/webgl-water/), with the sphere replaced by cubes of various shapes.

- A CPU height field stores `(height, velocity, normal.x, normal.z)` per cell and runs the same two-pass wave equation as the original. The state is uploaded as an RGBA half float `DataTexture` and displaces the water plane in the vertex node.
- The caustic map is built by projecting every surface cell onto the pool floor along its refracted sun ray. Local compression of the projection concentrates light, so the caustic texture is indexed by surface coordinate and looked up where each floor pixel's sun ray entered the water.
- Water, the irregular tiled basin and the boxes are shaded with analytic ray tracing in TSL: the surface reflects and refracts the boxes, basin and procedural sky, while the basin receives the animated caustics and every box casts a soft shadow.
- Moving a box through the water displaces the height field around its footprint, so dragging a shape leaves a propagating wake.
- The simulation runs on a fixed 1/60 s accumulator with at most three catch-up steps per frame, so the ripples behave consistently regardless of the display refresh rate.

## Renderer Support

All shading is written with TSL node materials, so the same effect runs on both renderers:

- **WebGPU** executes the node graph directly with `WebGPURenderer`.
- **WebGL** compiles the same TSL graph to GLSL through `WebGLNodesHandler`.

Because the basin, boxes and sky are ray traced inside the shaders rather than captured from the scene, no render targets are involved and both backends produce the same image.
