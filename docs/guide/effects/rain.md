---
lang: en-US
title: Rain
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Rain from '@site/src/components/effects/Rain'
import RainCollision from '@site/src/components/effects/RainCollision'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Rain />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Rain rendererType="webgl" />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="rgb(40, 42, 54)" rendererType="webgl" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Collision & Splash

Pass a grayscale `heightMap` and drops stop at the surface instead of falling
through it. Each impact spawns an expanding ripple, so rain reads as hitting
the ground. The map covers `heightMapSize` world units centred on the origin and
is sampled like a plane's UVs (`u = x / size + 0.5`, `v = 0.5 - z / size`), so
terrain displaced by the same image lines up exactly with the impacts.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RainCollision />

    ```tsx
    import { useState } from 'react'
    import * as THREE from 'three'
    import { Rain, Scene } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    const SIZE = 40
    const HEIGHT = 24
    const GROUND_Y = -HEIGHT / 2
    const AMPLITUDE = HEIGHT * 0.4

    export default function App() {
      const [heightMap, setHeightMap] = useState<THREE.CanvasTexture | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(0, 8, 27)
        controls.target.set(0, -3, 0)
        controls.update()

        // Any grayscale image works; this one is generated to avoid assets.
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 128
        const ctx = canvas.getContext('2d')!
        const image = ctx.createImageData(128, 128)
        for (let y = 0; y < 128; y++) {
          for (let x = 0; x < 128; x++) {
            const value = (Math.sin(x / 11) * Math.cos(y / 13) * 0.5 + 0.5) * 255
            const i = (y * 128 + x) * 4
            image.data[i] = image.data[i + 1] = image.data[i + 2] = value
            image.data[i + 3] = 255
          }
        }
        ctx.putImageData(image, 0, 0)

        const texture = new THREE.CanvasTexture(canvas)
        texture.generateMipmaps = false
        texture.minFilter = THREE.LinearFilter
        setHeightMap(texture)

        // Terrain displaced by the same map, so drops land on the visible surface.
        const geometry = new THREE.PlaneGeometry(SIZE, SIZE, 128, 128)
        geometry.rotateX(-Math.PI / 2)
        const position = geometry.attributes.position
        const uv = geometry.attributes.uv
        for (let i = 0; i < position.count; i++) {
          const col = Math.round(uv.getX(i) * 127)
          const row = Math.round((1 - uv.getY(i)) * 127)
          position.setY(i, GROUND_Y + (image.data[(row * 128 + col) * 4] / 255) * AMPLITUDE)
        }
        position.needsUpdate = true
        geometry.computeVertexNormals()
        scene.add(
          new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 0.85 })
          )
        )
      }

      return (
        <Scene bgColor="rgb(28, 30, 40)" axesHelper={false} gridHelper={false} style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          {heightMap && (
            <Rain
              count={5000}
              range={SIZE}
              height={HEIGHT}
              heightMap={heightMap}
              heightMapSize={SIZE}
              heightMapAmplitude={AMPLITUDE}
              groundHeight={GROUND_Y}
              splashSize={1}
              splashDuration={0.7}
            />
          )}
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <RainCollision rendererType="webgl" />

    ```tsx
    // Same component, rendered with the classic WebGL renderer:
    <Scene bgColor="rgb(28, 30, 40)" rendererType="webgl" axesHelper={false} gridHelper={false} onCreated={handleCreated}>
      {heightMap && <Rain heightMap={heightMap} splashSize={1} splashDuration={0.7} />}
    </Scene>
    ```
  </TabItem>
</Tabs>

Set `splash={false}` to keep the collision but skip the ripples, and use
`splashColor`, `splashSize` and `splashDuration` to tune them.

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| count | number | 4000 | Number of raindrops |
| color | string \| number \| Color | 0xb0c4de | Raindrop color |
| speed | number | 1 | Falling speed multiplier |
| range | number | 20 | Horizontal distribution range |
| height | number | 15 | Falling height range |
| windX | number | 0.1 | Wind force on X axis |
| windZ | number | 0 | Wind force on Z axis |
| opacity | number | 0.8 | Raindrop opacity |
| heightMap | string \| Texture | - | Grayscale height map the drops collide with |
| heightMapSize | number | range | World size covered by the height map |
| heightMapAmplitude | number | height * 0.4 | Vertical extent added by the height map |
| groundHeight | number | -height / 2 | Base ground Y of the height map |
| splash | boolean | true | Draw an expanding ripple where each drop lands |
| splashColor | string \| number \| Color | 0xd6ecff | Ripple color |
| splashSize | number | 0.9 | World radius of a ripple at its widest |
| splashDuration | number | 0.6 | Ripple lifetime in seconds |
