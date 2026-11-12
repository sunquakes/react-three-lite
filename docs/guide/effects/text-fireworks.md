---
id: text-fireworks
lang: en-US
title: Text Fireworks
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import TextFireworks from '@site/src/components/effects/TextFireworks'

A sentence is rendered to an offscreen canvas, sampled into particles, and every sampled pixel becomes a glowing dot. On launch the glyphs fly apart, split into colour groups from left to right, burst into four staggered fireworks, then drift back to the exact pixel they came from until the text is readable again. A second, dimmer and slightly delayed layer acts as the trail.

## Type

Class

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <TextFireworks />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, TextFireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<TextFireworks | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1, 6)
        camera.lookAt(0, 1, 0)

        const effect = new TextFireworks({ text: 'Good things are coming' })
        scene.add(effect)
        effectRef.current = effect
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          effectRef.current?.dispose()
          effectRef.current = null
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
    <TextFireworks rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, TextFireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<TextFireworks | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1, 6)
        camera.lookAt(0, 1, 0)

        const effect = new TextFireworks({ text: 'Good things are coming' })
        scene.add(effect)
        effectRef.current = effect
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          effectRef.current?.dispose()
          effectRef.current = null
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

## Custom Text

Call `setText()` to sample a new sentence and `launch()` to replay the cycle. This is what the input above the demo does.

```tsx
const effect = new TextFireworks({ text: 'Good things are coming' })
scene.add(effect)

// Sample new text and settle the particles on the new glyphs
effect.setText('Hello, world')

// Replay lift-off, burst and return
effect.launch()
```

The effect plays once automatically 1.2 seconds after it is added to the scene. Pass `autoPlay: false` if you prefer to trigger it yourself.

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| text | string | 'Good things are coming' | Text sampled into particles |
| colors | THREE.ColorRepresentation[] | orange, gold, blue, purple | Burst colour of each horizontal group, left to right |
| burstCenters | Array\<[number, number]\> | four staggered positions | Burst centre of each group in world units |
| burstScale | number | 1 | Uniform scale applied to burst centres and radial spread |
| groupDelay | number | 0.22 | Seconds between the launches of successive groups |
| groupJitter | number | 0.2 | Extra per-particle delay jitter in seconds |
| pointSize | number | 3.4 | Particle size in CSS pixels |
| trailOffset | number | 0.105 | Seconds the trail layer lags behind the main layer |
| trailOpacity | number | 0.34 | Opacity multiplier of the trail layer |
| restColor | THREE.ColorRepresentation | 0xffd4ad | Colour the letters rest at and fade back to |
| worldScale | number | 0.0068 | World units per sampled canvas pixel |
| offsetY | number | 0.55 | Vertical offset of the text centre in world units |
| autoPlay | boolean | true | Play once automatically after the object is created |
| autoPlayDelay | number | 1.2 | Seconds before the automatic launch |
| seed | number | 1 | Seed for the deterministic per-particle randomness |

## Members

| Name | Type | Description |
|------|------|-------------|
| points | THREE.Mesh | Main particle layer |
| trail | THREE.Mesh | Delayed, dimmer copy of the same particles |
| text | string | Text currently sampled into the particle cloud |
| particleCount | number | Number of glyph particles |
| duration | number | Length of one lift-off / burst / return cycle in seconds |
| phase | number | Current position on the timeline in seconds |
| playing | boolean | Whether the timeline is currently advancing |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: TextFireworksOptions) | Create the effect. It extends `THREE.Group`, so add it to the scene and move it with `position` |
| setText | (text: string) => void | Sample new text and rebuild the particles. Blank text is ignored |
| launch | () => void | Restart the lift-off / burst / return cycle |
| update | (deltaSeconds: number) => void | Advance the timeline manually, the internal loop calls this per frame |
| dispose | () => void | Stop the animation, dispose the geometry and materials and remove the effect from the scene. Call it on unmount to prevent memory leaks |
