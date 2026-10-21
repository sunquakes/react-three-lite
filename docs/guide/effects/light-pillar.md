---
id: light-pillar
lang: en-US
title: Light Pillar
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import LightPillar from '@site/src/components/effects/LightPillar'

A conical light pillar built from a translucent outer cone, a brighter inner core, a breathing glow at the tip and two pulse rings diffusing on the ground. It is commonly used as a data marker: map a normalized value to the `height` option so taller pillars mean larger values.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <LightPillar />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, LightPillar } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const pillarsRef = useRef<LightPillar[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 2.4, 6)
        camera.lookAt(0, 1, 0)

        const data = [
          { x: -2.2, z: 0, value: 0.35, color: 0x00ffff },
          { x: 0, z: -0.6, value: 1, color: 0x36e0a0 },
          { x: 2.2, z: 0, value: 0.62, color: 0xffb347 }
        ]

        data.forEach(({ x, z, value, color }) => {
          const pillar = new LightPillar({
            color,
            height: 1 + value * 2.4,
            radius: 0.22
          })
          pillar.position.set(x, 0, z)
          scene.add(pillar)
          pillarsRef.current.push(pillar)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          pillarsRef.current.forEach((pillar) => pillar.dispose())
          pillarsRef.current = []
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
    <LightPillar rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, LightPillar } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const pillarsRef = useRef<LightPillar[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 2.4, 6)
        camera.lookAt(0, 1, 0)

        const data = [
          { x: -2.2, z: 0, value: 0.35, color: 0x00ffff },
          { x: 0, z: -0.6, value: 1, color: 0x36e0a0 },
          { x: 2.2, z: 0, value: 0.62, color: 0xffb347 }
        ]

        data.forEach(({ x, z, value, color }) => {
          const pillar = new LightPillar({
            color,
            height: 1 + value * 2.4,
            radius: 0.22
          })
          pillar.position.set(x, 0, z)
          scene.add(pillar)
          pillarsRef.current.push(pillar)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          pillarsRef.current.forEach((pillar) => pillar.dispose())
          pillarsRef.current = []
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
| color | number | 0x00ffff | Pillar color (cyan by default) |
| height | number | 3 | Pillar height along the Y axis, the base sits on `y = 0` |
| radius | number | 0.3 | Radius of the cone base |
| opacity | number | 1 | Global opacity multiplier (0-1) |
| speed | number | 1 | Animation speed multiplier |
| segments | number | 32 | Radial segment count of the cones and rings |
| glow | boolean | true | Render the breathing glow at the top of the pillar |
| ring | boolean | true | Render the two diffusing pulse rings at the base |
| ringRadius | number | radius * 3 | Outer radius the pulse rings expand to |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: LightPillarOptions) | Create a light pillar. It extends `THREE.Group`, so add it to the scene and move it with `position` |
| dispose | () => void | Dispose the pillar, stop the animation and remove it from the scene. Should be called on component unmount to prevent memory leaks |
