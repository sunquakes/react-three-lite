---
id: signal-wave
lang: en-US
title: Signal Wave
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SignalWave from '@site/src/components/effects/SignalWave'

A broadcast ping. A billboarded quad paints one soft-edged arc; grow the mesh scale while `life` runs from `0` to `1` and each pulse reads as a signal that spreads outwards and dies away. Chain several waves along the same bearing with staggered phases to build a travelling stream of downlink pings.

Two ways to drive it:

- **Automatic** — pass `travel` and the wave animates itself along `bearing` from `origin`: position, scale, billboard and `life` are all driven from the wave's own clock, so no animation loop is needed. `count` adds staggered pulses as children, so one object renders a whole stream of pings.
- **Manual** — position, scale and billboard the quad yourself with `faceCamera()`, aim the arc with `setDirection()` and write `life` every frame.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SignalWave />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, SignalWave } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const wavesRef = useRef<SignalWave | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 3.2, 11)
        camera.lookAt(0, 5, 0)

        // `travel` makes the pulses climb the bearing on their own and `count`
        // spreads six of them out in phase; no animation loop required.
        const waves = new SignalWave({
          bearing: [0.24, 1, 0],
          travel: 26,
          period: 26 / 7,
          count: 6,
          startScale: 0.45,
          endScale: 3.4
        })
        scene.add(waves)
        wavesRef.current = waves
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          wavesRef.current?.dispose()
          wavesRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SignalWave rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, SignalWave } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const wavesRef = useRef<SignalWave | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 3.2, 11)
        camera.lookAt(0, 5, 0)

        // `travel` makes the pulses climb the bearing on their own and `count`
        // spreads six of them out in phase; no animation loop required.
        const waves = new SignalWave({
          bearing: [0.24, 1, 0],
          travel: 26,
          period: 26 / 7,
          count: 6,
          startScale: 0.45,
          endScale: 3.4
        })
        scene.add(waves)
        wavesRef.current = waves
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          wavesRef.current?.dispose()
          wavesRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          onCreated={handleCreated}
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| innerColor | number | 0x2985ff | Color of the arc where it is faint |
| outerColor | number | 0xbdeaff | Color of the arc where it is dense |
| direction | [number, number] | [1, 0] | In-plane bearing the arc opens towards (manual mode) |
| life | number | 0 | Initial life in the 0-1 range (manual mode) |
| bearing | [number, number, number] | [0, 1, 0] | World-space bearing the pulse travels and the arc opens along (automatic mode) |
| origin | [number, number, number] | [0, 0, 0] | Start point of the travel in world space (automatic mode) |
| travel | number | — | World distance the pulse covers in one cycle. When set, the wave animates itself and no per-frame code is needed |
| period | number | 2.4 | Seconds per cycle in automatic mode |
| phase | number | 0 | Phase offset in the 0-1 range used to stagger pulses (automatic mode) |
| count | number | 1 | Number of staggered pulses created as children (automatic mode) |
| startScale | number | 0.45 | Scale at the start of a cycle (automatic mode) |
| endScale | number | 3.4 | Scale at the end of a cycle (automatic mode) |

## Properties

| Name | Type | Description |
|------|------|-------------|
| life | number | Pulse life. `0` fades in at the origin and `1` fades out at the end. In automatic mode, writing it shifts the phase and the pulse keeps travelling from there |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: SignalWaveOptions) | Create the pulse. It extends `THREE.Mesh`, so position and scale it, then add it to the scene |
| setDirection | (x: number, y: number) => void | Aim the arc inside the quad plane (manual mode) |
| faceCamera | (camera: THREE.Camera) => void | Turn the quad towards the camera so the arc is never lost edge-on (manual mode) |
| dispose | () => void | Dispose the geometry, material and staggered child pulses, then detach from the scene |
