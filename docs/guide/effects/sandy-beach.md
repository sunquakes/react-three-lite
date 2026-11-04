---
id: sandy-beach
lang: en-US
title: Sandy Beach
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SandyBeach from '@site/src/components/effects/SandyBeach'

A first-person dawn beach walk. The island is a 260 m ring, and the sand height, the wet band, the ocean swells and the footprints all share one set of shore coordinates, so the waterline, the walker and the shader stay aligned at every angle. The sky is evaluated analytically and reused for the water and wet-sand reflections, which keeps the WebGPU and the WebGL renderer on the same single-pass result.

Drag to look around, walk with `WASD` or the arrow keys, and scroll to take a step forward. Footprints are written into a small ring buffer and washed away by the tide.

## Type

Component

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SandyBeach />

    ```tsx
    import { Scene, SandyBeach } from 'react-three-lite'

    function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      return (
        <Scene
          rendererType={rendererType}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <SandyBeach preset="sunrise" />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SandyBeach rendererType="webgl" />

    ```tsx
    import { Scene, SandyBeach } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <SandyBeach preset="sunrise" />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Interaction

- **Drag** turns the camera. The look drag is captured on the canvas, so the page does not scroll while you look around.
- **`W` / `A` / `S` / `D`** or the **arrow keys** walk across the sand. Keyboard input only applies while the pointer is over the canvas.
- **Wheel** takes a step forward with a short impulse instead of a continuous zoom.
- The walker stays inside the beach ring, so the camera can never walk into the ocean or climb the inland slope.

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| preset | 'sunrise' \| 'morning' \| 'sunset' \| 'night' \| 'blueHour' | 'sunrise' | Time-of-day preset. Changing it cross-fades the sky, water and sand colours |
| autoWalk | boolean | false | Walk forward automatically, useful for an attract-mode background |
| crouching | boolean | false | Lower the camera to a crouched eye height |
| interactive | boolean | true | Attach pointer look, `WASD` / arrow keys and wheel stepping to the canvas |

## Presets

| Preset | Description |
|--------|-------------|
| sunrise | Warm low sun, peach horizon and a cool upper sky |
| morning | High sun, pale horizon and a bright turquoise shallows |
| sunset | Very low sun behind the water, orange glow and a violet zenith |
| night | Moon, stars and a dim blue ambient light |
| blueHour | Sun just below the horizon, pink glow and a deep violet-blue sky |

## Notes

- The component owns the camera while it is mounted. It saves the previous camera pose, field of view and near/far planes, disables the scene's `OrbitControls`, and restores all of them on unmount.
- The scene renders as a sky sphere, a sand ring and an ocean ring built with TSL node materials, so both renderers compile the same shader.
- Every geometry, material, texture and event listener is disposed on unmount.
