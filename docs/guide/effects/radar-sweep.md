---
id: radar-sweep
lang: en-US
title: Radar Sweep
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import RadarSweep from '@site/src/components/effects/RadarSweep'

A ground-radar pulse: a ring band rolls out from the mesh origin as `progress` goes from `0` to `1`, broken up by drifting noise so the crest never reads as a drawn circle. Each pulse paints a leading edge, a weaker first echo trailing it, the faint already-swept footprint and short blips over buried features.

When a `heightAt` sampler is supplied the band is displaced onto the terrain, so the pulse follows uneven ground instead of slicing through it. Set the mesh position **before** adding it to the scene (the band is rebuilt on `added`), or call `rebuild()` after moving it.

Pass `period` to let the pulse loop on its own — no animation loop is needed. Omit `period` and write `progress` every frame to drive the scan manually.

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RadarSweep />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, RadarSweep } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function terrainHeight(x: number, z: number): number {
      return Math.sin(x * 0.55) * 0.22 + Math.cos(z * 0.4) * 0.18
    }

    export default function App() {
      const sweepRef = useRef<RadarSweep | null>(null)
      const groundRef = useRef<THREE.Mesh | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 7, 10)
        camera.lookAt(0, 0, 0)

        // Displace the ground with the same sampler the sweep conforms to.
        const groundGeometry = new THREE.PlaneGeometry(22, 22, 96, 96)
        groundGeometry.rotateX(-Math.PI / 2)
        const positions = groundGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < positions.count; i += 1) {
          positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
        }
        groundGeometry.computeVertexNormals()

        const ground = new THREE.Mesh(
          groundGeometry,
          new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 1 })
        )
        scene.add(ground)
        groundRef.current = ground

        // `period` makes the sweep loop on its own; no animation loop required.
        const sweep = new RadarSweep({ radius: 8, heightAt: terrainHeight, period: 2.4 })
        scene.add(sweep)
        sweepRef.current = sweep
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          sweepRef.current?.dispose()
          sweepRef.current = null

          const ground = groundRef.current
          if (ground) {
            ground.parent?.remove(ground)
            ground.geometry.dispose()
            ;(ground.material as THREE.Material).dispose()
          }
          groundRef.current = null
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
    <RadarSweep rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, RadarSweep } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function terrainHeight(x: number, z: number): number {
      return Math.sin(x * 0.55) * 0.22 + Math.cos(z * 0.4) * 0.18
    }

    export default function App() {
      const sweepRef = useRef<RadarSweep | null>(null)
      const groundRef = useRef<THREE.Mesh | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 7, 10)
        camera.lookAt(0, 0, 0)

        // Displace the ground with the same sampler the sweep conforms to.
        const groundGeometry = new THREE.PlaneGeometry(22, 22, 96, 96)
        groundGeometry.rotateX(-Math.PI / 2)
        const positions = groundGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < positions.count; i += 1) {
          positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
        }
        groundGeometry.computeVertexNormals()

        const ground = new THREE.Mesh(
          groundGeometry,
          new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 1 })
        )
        scene.add(ground)
        groundRef.current = ground

        // `period` makes the sweep loop on its own; no animation loop required.
        const sweep = new RadarSweep({ radius: 8, heightAt: terrainHeight, period: 2.4 })
        scene.add(sweep)
        sweepRef.current = sweep
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          sweepRef.current?.dispose()
          sweepRef.current = null

          const ground = groundRef.current
          if (ground) {
            ground.parent?.remove(ground)
            ground.geometry.dispose()
            ;(ground.material as THREE.Material).dispose()
          }
          groundRef.current = null
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
| radius | number | 8 | Outer radius the pulse expands to |
| segments | number | 128 | Radial segment count of the ring |
| rings | number | 20 | Concentric segment count of the ring |
| heightAt | (x: number, z: number) => number | — | World-space ground sampler. When given, the band is displaced onto the terrain |
| color | number | 0x57ccff | Color of the sweeping bands |
| crestColor | number | 0xa8f5ff | Color of the leading crest |
| echoDelay | number | 1.8 | Distance the weaker first return trails behind the crest |
| opacity | number | 0.9 | Alpha multiplier of the whole pulse |
| lift | number | 0.04 | Height offset above the terrain |
| progress | number | 0 | Initial pulse progress in the 0-1 range |
| period | number | — | Seconds per full sweep. When set, the pulse advances on its own from the render timer and no per-frame code is needed |

## Properties

| Name | Type | Description |
|------|------|-------------|
| progress | number | Pulse progress. `0` starts at the origin, `1` reaches the outer radius. With `period` set, writing it shifts the phase and the pulse keeps looping from there; without it, write it every frame to drive the scan |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: RadarSweepOptions) | Create the pulse. It extends `THREE.Mesh`, so position it and add it to the scene |
| rebuild | () => void | Re-sample `heightAt` for the current world position. Called automatically on `added` |
| dispose | () => void | Remove the `added` listener, dispose the geometry and material and detach from the scene |
