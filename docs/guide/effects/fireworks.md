---
id: fireworks
lang: en-US
title: Fireworks
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Fireworks from '@site/src/components/effects/Fireworks'

A fireworks shell built entirely in the shader. A single launch streak rises from the origin, then bursts into a spherical spray of gravity-bent ribbon trails whose heads glow and whose tails dissolve through value noise. One `Fireworks` instance is one shell — add several with different colors, heights and phases to script a full show.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Fireworks />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, Fireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const fireworksRef = useRef<Fireworks[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 6, 17)
        camera.lookAt(0, 6, 0)

        const shells = [
          { color: 0xffd4a0, height: 6.6, scale: 3.6, offset: [-3.6, 0, -1.5], launchDuration: 1.25, burstDuration: 1.9 },
          { color: 0x7ad7ff, height: 5.9, scale: 3.9, offset: [-1.4, 0, 1.6], launchDuration: 1.7, burstDuration: 1.6 },
          { color: 0xff6b6b, height: 7.4, scale: 3.2, offset: [3.2, 0, -0.8], launchDuration: 1.5, burstDuration: 2.2 }
        ]

        shells.forEach((shell) => {
          const fireworks = new Fireworks({
            color: shell.color,
            burstHeight: shell.height,
            burstScale: shell.scale,
            burstPositionOffset: new THREE.Vector3(...shell.offset),
            launchDuration: shell.launchDuration,
            burstDuration: shell.burstDuration,
            loop: true
          })
          scene.add(fireworks)
          fireworksRef.current.push(fireworks)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          fireworksRef.current.forEach((fireworks) => fireworks.dispose())
          fireworksRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="#1a1a2e"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Fireworks rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, Fireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const fireworksRef = useRef<Fireworks[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 6, 17)
        camera.lookAt(0, 6, 0)

        const shells = [
          { color: 0xffd4a0, height: 6.6, scale: 3.6, offset: [-3.6, 0, -1.5], launchDuration: 1.25, burstDuration: 1.9 },
          { color: 0x7ad7ff, height: 5.9, scale: 3.9, offset: [-1.4, 0, 1.6], launchDuration: 1.7, burstDuration: 1.6 },
          { color: 0xff6b6b, height: 7.4, scale: 3.2, offset: [3.2, 0, -0.8], launchDuration: 1.5, burstDuration: 2.2 }
        ]

        shells.forEach((shell) => {
          const fireworks = new Fireworks({
            color: shell.color,
            burstHeight: shell.height,
            burstScale: shell.scale,
            burstPositionOffset: new THREE.Vector3(...shell.offset),
            launchDuration: shell.launchDuration,
            burstDuration: shell.burstDuration,
            loop: true
          })
          scene.add(fireworks)
          fireworksRef.current.push(fireworks)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          fireworksRef.current.forEach((fireworks) => fireworks.dispose())
          fireworksRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="#1a1a2e"
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
| radius | number | 1 | Burst trail target length radius, baked into the geometry |
| detail | number | 0 | Icosahedron subdivision level, baked into the geometry |
| segments | number | 5 | Number of segments sampled along each trail, baked into the geometry |
| gravity | number | 1 | Gravity parabola coefficient that bends the trails downward, baked into the geometry |
| width | number | 0.1 | Ribbon half-width |
| startTime | number | 0 | Animation start time in seconds |
| launchDuration | number | 1.5 | Launch phase duration in seconds |
| delayDuration | number | -0.4 | Delay between launch and burst, may be negative to overlap |
| burstDuration | number | 2 | Burst phase duration in seconds |
| burstHeight | number | 6.5 | Burst height along the local Y axis |
| burstScale | number | 3.5 | Overall burst scale |
| burstPositionOffset | THREE.Vector3 | (0, 0, 0) | Burst origin offset |
| loop | boolean | true | Replay the effect when one cycle finishes |
| color | THREE.ColorRepresentation | '#ffd4a0' | Base ribbon color |
| bloomIntensity | number | 9 | Head glow intensity |
| bloomFalloff | number | 18 | Head glow length exponent, larger tightens the tip |
| noiseFalloff | number | 3 | Noise dissolve time exponent |
| noiseScale | THREE.Vector2 | (10, 200) | Noise UV scale (across, along) |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: FireworksOptions) | Create a fireworks shell. It extends `THREE.Mesh`, so add it to the scene and move it with `position` |
| update | (deltaSeconds: number) => void | Advance the animation time in seconds |
| restart | () => void | Reset the current time to 0 and replay from `startTime` |
| dispose | () => void | Dispose the shell, stop the animation and remove it from the scene. Should be called on component unmount to prevent memory leaks |
