---
lang: en-US
title: HeightFog
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import HeightFog from '@site/src/components/effects/HeightFog'

## Default Usage

Screen-space height fog: an exponential fog layer whose density falls off with world height, with flowing noise on the fog plane and directional inscattering towards a light source. Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

The demo below drops a ground plane plus a row of pillars receding into the distance, so the fog layers over the geometry and the height gradient becomes visible.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <HeightFog />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, HeightFog } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // Columns receding into the distance: [x, z, width, height].
    const pillars: [number, number, number, number][] = [
      [-5, 5, 2.8, 13],
      [6, 2, 3.2, 17],
      [-2, -4, 2.6, 11],
      [8, -9, 3.4, 21],
      [-9, -15, 3.0, 15],
      [3, -22, 2.8, 19],
      [-6, -30, 3.4, 23]
    ]

    export default function App() {
      const meshesRef = useRef<THREE.Mesh[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 5, 14)
        camera.lookAt(0, 7, -12)

        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(400, 400),
          new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ color: 0x5c6579, roughness: 0.85 })
        const columns = pillars.map(([x, z, width, height]) => {
          const column = new THREE.Mesh(geometry, material)
          column.position.set(x, height / 2, z)
          column.scale.set(width, height, width)
          return column
        })

        meshesRef.current = [ground, ...columns]
        scene.add(...meshesRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          meshesRef.current.forEach((mesh) => {
            mesh.parent?.remove(mesh)
            mesh.geometry.dispose()
            const meshMaterial = mesh.material as THREE.Material
            meshMaterial.dispose()
          })
          meshesRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          gridHelper={{ size: 400, divisions: 40, colorGrid: 0x3a4050, colorCenterLine: 0x4d5570, y: 0.02 }}
          style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <HeightFog />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <HeightFog rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, HeightFog } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // Columns receding into the distance: [x, z, width, height].
    const pillars: [number, number, number, number][] = [
      [-5, 5, 2.8, 13],
      [6, 2, 3.2, 17],
      [-2, -4, 2.6, 11],
      [8, -9, 3.4, 21],
      [-9, -15, 3.0, 15],
      [3, -22, 2.8, 19],
      [-6, -30, 3.4, 23]
    ]

    export default function App() {
      const meshesRef = useRef<THREE.Mesh[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 5, 14)
        camera.lookAt(0, 7, -12)

        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(400, 400),
          new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2

        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ color: 0x5c6579, roughness: 0.85 })
        const columns = pillars.map(([x, z, width, height]) => {
          const column = new THREE.Mesh(geometry, material)
          column.position.set(x, height / 2, z)
          column.scale.set(width, height, width)
          return column
        })

        meshesRef.current = [ground, ...columns]
        scene.add(...meshesRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          meshesRef.current.forEach((mesh) => {
            mesh.parent?.remove(mesh)
            mesh.geometry.dispose()
            const meshMaterial = mesh.material as THREE.Material
            meshMaterial.dispose()
          })
          meshesRef.current = []
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          gridHelper={{ size: 400, divisions: 40, colorGrid: 0x3a4050, colorCenterLine: 0x4d5570, y: 0.02 }}
          style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <HeightFog />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Props

### Fog body

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| fogColor | string \| number \| Color | '#c9d4cc' | Fog color |
| fogDensity | number | 0.02 | Fog density at the fog plane |
| fogHeight | number | 10 | World height of the fog plane |
| fogHeightFalloff | number | 0.25 | Height falloff; density halves every 1/falloff units above the fog plane |
| fogMaxOpacity | number | 1 | Maximum fog opacity (caps how much the fog can cover the scene) |
| fogStartDistance | number | 0 | Distance from the camera where fog accumulation starts |

### Flowing noise

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| noiseStrength | number | 0 | How far noise displaces the fog plane vertically (0 disables noise) |
| noiseScale | number | 0.012 | Scale of the noise pattern in world units |
| noiseSpeedX | number | 0 | Noise flow speed along the X axis |
| noiseSpeedZ | number | 0 | Noise flow speed along the Z axis |

### Directional inscattering

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| inscatteringColor | string \| number \| Color | '#ffe2b0' | Color of the light inscattering |
| inscatteringIntensity | number | 1 | Inscattering intensity |
| inscatteringExponent | number | 5 | Sharpness of the directional falloff around the light direction |
| inscatteringStartDistance | number | 0 | Distance from the camera where inscattering starts |
| lightAzimuth | number | 30 | Light direction azimuth in degrees |
| lightElevation | number | 25 | Light direction elevation in degrees |
