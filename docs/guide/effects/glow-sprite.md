---
id: glow-sprite
lang: en-US
title: Glow Sprite
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import GlowSprite from '@site/src/components/effects/GlowSprite'

A camera-facing glow dot built from a generated radial-gradient texture with additive blending. It never faces away from the viewer and costs a single quad, so it suits point-like highlights: distant planets, beacons, signal sources or lens glows.

Pass `pulsePeriod` to make a sprite breathe on its own — a beacon needs no animation loop. `phase` staggers several pulsing sprites.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <GlowSprite />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, GlowSprite } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    interface DotConfig {
      position: [number, number, number]
      size: number
      color: number
      tint: number
      opacity: number
      pulsePeriod?: number
      phase?: number
    }

    // A handful of glowing dots: the pale blue Earth and two fainter stars,
    // one of them pulsing like a beacon — no animation loop needed.
    const dots: DotConfig[] = [
      { position: [0, 1, 0], size: 3.2, color: 0x8ecbff, tint: 0xbcdfff, opacity: 0.9 },
      { position: [-3.4, -0.8, -2], size: 1.4, color: 0xffb066, tint: 0xffd9a8, opacity: 0.8, pulsePeriod: 2.2, phase: 0.3 },
      { position: [3.6, 2.4, -4], size: 2.2, color: 0x9ce8ff, tint: 0xd8f4ff, opacity: 0.85 }
    ]

    export default function App() {
      const dotsRef = useRef<GlowSprite[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        dots.forEach((dot) => {
          const sprite = new GlowSprite({
            size: dot.size,
            color: dot.color,
            tint: dot.tint,
            opacity: dot.opacity,
            pulsePeriod: dot.pulsePeriod,
            phase: dot.phase
          })
          sprite.position.set(...dot.position)
          scene.add(sprite)
          dotsRef.current.push(sprite)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          dotsRef.current.forEach((sprite) => sprite.dispose())
          dotsRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(8, 10, 20)"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <GlowSprite rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, GlowSprite } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    interface DotConfig {
      position: [number, number, number]
      size: number
      color: number
      tint: number
      opacity: number
      pulsePeriod?: number
      phase?: number
    }

    // A handful of glowing dots: the pale blue Earth and two fainter stars,
    // one of them pulsing like a beacon — no animation loop needed.
    const dots: DotConfig[] = [
      { position: [0, 1, 0], size: 3.2, color: 0x8ecbff, tint: 0xbcdfff, opacity: 0.9 },
      { position: [-3.4, -0.8, -2], size: 1.4, color: 0xffb066, tint: 0xffd9a8, opacity: 0.8, pulsePeriod: 2.2, phase: 0.3 },
      { position: [3.6, 2.4, -4], size: 2.2, color: 0x9ce8ff, tint: 0xd8f4ff, opacity: 0.85 }
    ]

    export default function App() {
      const dotsRef = useRef<GlowSprite[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        dots.forEach((dot) => {
          const sprite = new GlowSprite({
            size: dot.size,
            color: dot.color,
            tint: dot.tint,
            opacity: dot.opacity,
            pulsePeriod: dot.pulsePeriod,
            phase: dot.phase
          })
          sprite.position.set(...dot.position)
          scene.add(sprite)
          dotsRef.current.push(sprite)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          dotsRef.current.forEach((sprite) => sprite.dispose())
          dotsRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(8, 10, 20)"
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
| color | number | 0x8ecbff | Color of the radial gradient halo |
| tint | number | 0xbcdfff | Multiplied into the texture, lets one texture serve several hues |
| size | number | 3.2 | World-space size of the sprite |
| opacity | number | 0.9 | Global opacity multiplier (0-1) |
| resolution | number | 128 | Pixel size of the generated glow texture |
| pulsePeriod | number | — | Seconds per breathing cycle. When set, the halo gently pulses on its own — scale swings about 12% and opacity between 75% and 100% of the configured values — and no per-frame code is needed |
| phase | number | 0 | Phase offset in the 0-1 range used to stagger pulsing sprites |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: GlowSpriteOptions) | Create the sprite. It extends `THREE.Sprite`, so position it and add it to the scene |
| dispose | () => void | Dispose the generated texture and material and detach from the scene |
