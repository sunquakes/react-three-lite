---
id: sky-dome
lang: en-US
title: Sky Dome
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SkyDome from '@site/src/components/effects/SkyDome'

A gradient sky sphere that replaces the scene background: four color bands rising from the horizon to the zenith, plus a wide halo and a bright disc around a configurable sun direction. The dome is rendered from the inside with `BackSide` and no depth write, so it always reads as an infinitely distant sky.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SkyDome />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, SkyDome } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components

        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        skyRef.current = new SkyDome()
        scene.add(skyRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
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
    <SkyDome rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, SkyDome } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components

        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        skyRef.current = new SkyDome()
        scene.add(skyRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
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
| radius | number | 420 | Radius of the dome sphere. Keep it larger than any scene content |
| horizonColor | number | 0xf27536 | Color of the band lying on the horizon |
| lowerSkyColor | number | 0x803624 | Color just above the horizon |
| upperSkyColor | number | 0x260f13 | Color of the intermediate band |
| zenithColor | number | 0x060409 | Color at the top of the dome |
| sunDirection | [number, number, number] | [-0.78, 0.2, -0.6] | Direction of the sun, normalized internally |
| glowColor | number | 0xff9947 | Color of the wide halo around the sun |
| sunColor | number | 0xffe0b8 | Color of the sun disc |
| sunIntensity | number | 2.4 | Brightness multiplier of the sun disc |
| sunSize | number | 10 | Angular diameter of the sun disc in degrees. The disc is drawn in screen space, so it stays round wherever the sun sits in the view |
| segments | number | 48 | Horizontal segment count of the dome sphere |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: SkyDomeOptions) | Create the dome. It extends `THREE.Mesh`, so add it to the scene with `scene.add(sky)` |
| dispose | () => void | Dispose the geometry and material and remove the dome from the scene. Should be called on component unmount to prevent memory leaks |
