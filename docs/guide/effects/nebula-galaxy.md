---
id: nebula-galaxy
lang: en-US
title: Nebula Galaxy
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import NebulaGalaxy from '@site/src/components/effects/NebulaGalaxy'

A four-armed spiral galaxy drawn with additive billboard particles. The spiral arms, the core and the faint dust are generated from a polar-coordinate distribution, then a procedural haze plane softens the particle pattern. Drag to tilt the disc and reveal its thickness, scroll or pinch to zoom, and click to send a light wave from the core along the arms. Distant background stars stay fixed while the galaxy turns.

## Type

Class

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <NebulaGalaxy />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, NebulaGalaxy } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<NebulaGalaxy | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls, gridHelper } = components
        camera.position.set(0, 2.6, 11)
        camera.lookAt(0, 0, 0)

        // The galaxy handles the pointer itself
        controls.enabled = false
        if (gridHelper) gridHelper.visible = false

        const effect = new NebulaGalaxy()
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
    <NebulaGalaxy rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, NebulaGalaxy } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<NebulaGalaxy | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls, gridHelper } = components
        camera.position.set(0, 2.6, 11)
        camera.lookAt(0, 0, 0)

        // The galaxy handles the pointer itself
        controls.enabled = false
        if (gridHelper) gridHelper.visible = false

        const effect = new NebulaGalaxy()
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

## Interaction

The effect is fully interactive without any extra code, the internal loop and the canvas listeners are added when the group is added to the scene:

- **Drag** tilts the disc, clamped by `maxTiltX` and `maxTiltY`. The tilt is smoothed instead of snapped.
- **Wheel** or **pinch** zooms the disc between `minZoom` and `maxZoom`, so the camera never enters the core.
- **Click** or **tap** sends a light wave from the core. A click is only recognised when the pointer travelled less than 6 px, so dragging does not fire a wave.
- While the pointer is idle the galaxy slowly turns on its own (`autoRotate`). When the system requests reduced motion, both the idle rotation and the click wave are disabled by default.

Call `pulse()` to send a wave programmatically:

```tsx
const effect = new NebulaGalaxy()
scene.add(effect)

// Light wave from the core, useful for a click on a HUD button
effect.pulse()

// Blend towards another palette, freeze the spin or change its speed
effect.setPalette('aurora')
effect.setSpeed(0.5)
effect.setPaused(true)
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| arms | number | 4 | Number of spiral arms |
| armStars | number | 26000 | Stars that trace the spiral arms |
| coreStars | number | 4800 | Stars that fill the core |
| dustStars | number | 4400 | Large, faint stars that soften the edges |
| backgroundStars | number | 780 | Distant stars outside the galaxy body |
| radius | number | 5.15 | Galaxy radius in world units |
| armTightness | number | 1.12 | How tightly the arms wind with distance |
| palette | 'violet-gold' \| 'aurora' \| 'warm-flame' | 'violet-gold' | Colour scheme |
| speed | number | 1 | Spin speed multiplier |
| autoRotate | boolean | true | Slowly turn the galaxy when the pointer is idle. Defaults to `false` when reduced motion is requested |
| interaction | boolean | true | Attach drag / wheel / pinch listeners to the canvas |
| pulse | boolean | true | Enable the click wave. Defaults to `false` when reduced motion is requested |
| hazeOpacity | number | 0.95 | Opacity of the procedural haze layer |
| followSpeed | number | 5.8 | Smoothing speed of tilt, zoom and palette transitions |
| maxTiltX | number | 1.15 | Maximum vertical tilt in radians |
| maxTiltY | number | 1.25 | Maximum horizontal tilt in radians |
| minZoom | number | 0.62 | Smallest zoom factor |
| maxZoom | number | 1.55 | Largest zoom factor |
| seed | number | 7 | Seed for the deterministic star distribution |

## Members

| Name | Type | Description |
|------|------|-------------|
| galaxy | THREE.Group | Rotating part of the galaxy, the group the pointer tilts and zooms |
| stars | THREE.Mesh | Spiral arms, core and dust particles |
| haze | THREE.Mesh | Procedural haze plane |
| ring | THREE.Mesh | Expanding ring that follows a click or tap |
| background | THREE.Mesh | Distant stars that stay fixed while the galaxy turns |
| palette | GalaxyPalette | Colour scheme currently being blended towards |
| particleCount | number | Number of stars that make up the galaxy body |
| backgroundCount | number | Number of distant background stars |
| speed | number | Current spin speed multiplier |
| paused | boolean | Whether the spin is frozen |
| time | number | Accumulated shader time in seconds |
| pulseAge | number | Seconds since the last click wave started |
| tilt | `{ x: number; y: number }` | Current tilt applied to the disc in radians |
| zoom | number | Current zoom factor applied to the disc |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: NebulaGalaxyOptions) | Create the effect. It extends `THREE.Group`, so add it to the scene and move it with `position` |
| setPalette | (palette: GalaxyPalette) => void | Blend the core, arm and rim colours towards another built-in palette |
| setSpeed | (speed: number) => void | Set the spin speed multiplier, 0 freezes the shader time |
| setPaused | (paused: boolean) => void | Freeze or resume the spin and the idle rotation |
| setAutoRotate | (enabled: boolean) => void | Enable or disable the idle rotation |
| pulse | () => void | Send a light wave from the core along the arms |
| update | (deltaSeconds: number) => void | Advance the effect manually, the internal loop calls this per frame |
| dispose | () => void | Stop the animation, detach the canvas listeners, dispose the geometries and materials and remove the effect from the scene. Call it on unmount to prevent memory leaks |
