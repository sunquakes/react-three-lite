---
id: water-pool
lang: en-US
title: Water Pool
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaterPool from '@site/src/components/effects/WaterPool'
import WaterPoolIrregular from '@site/src/components/effects/WaterPoolIrregular'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPool />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components

        // A high sun keeps the caustics sharp; every effect shares this direction.
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

        camera.position.set(1.5, 1.1, 2.0)
        controls.target.set(0, -0.1, 0)
        camera.lookAt(0, -0.1, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        // The model is 0.86 x 0.53 x 1.64 units with its floor at y = 0.
        // Stretch it over the 2 x 2 water and drop it by one unit: the rim sits
        // just above the surface, so the water meets the tub walls everywhere.
        tub.scale.set(2.7, 1.92, 1.28)
        tub.position.set(0, -1, 0)
        scene.add(tub)
        tubRef.current = tub
      }

      // Cleanup on unmount
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPool rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.5, 1.1, 2.0)
        controls.target.set(0, -0.1, 0)
        camera.lookAt(0, -0.1, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        // The model is 0.86 x 0.53 x 1.64 units with its floor at y = 0.
        // Stretch it over the 2 x 2 water and drop it by one unit: the rim sits
        // just above the surface, so the water meets the tub walls everywhere.
        tub.scale.set(2.7, 1.92, 1.28)
        tub.position.set(0, -1, 0)
        scene.add(tub)
        tubRef.current = tub
      }

      // Cleanup on unmount
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

Drag inside the pool to add ripples, drag a box to push it around, and drag outside the pool to orbit the camera.

The tub around the water is a bathtub GLB loaded with `GLTFLoaderAsync`. It is 0.86 × 0.53 × 1.64 units with its floor at `y = 0`, so the demo stretches it over the 2 × 2 water and drops it by 1 unit. The tub is kept slightly smaller than the opening: its inner walls cut a little into the water and the rim lands just above the surface, so the water meets the tub on every side instead of leaving a dry gap. The model is purely visual — the shader still only traces the basin and the sky, so the shading cost does not change.

## Custom Shape

Pass an outline or any `THREE.BufferGeometry` to `shape` to replace the square tub. Points are `[x, z]` pairs on the XZ plane and geometry vertices are projected onto XZ; both are reduced to their convex hull. The outline must contain the origin and stay within -1…1 so the ripples and caustics cover the whole surface.

This demo dips into a downloaded corner bathtub instead of the square tub. The outline below traces the tub rim — a square back with a curved front — so the water fills the basin right up to the rim, and the pool is scaled and lifted to sit inside the model.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPoolIrregular />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // The tub is 1.2 x 1.2 units with its floor at y = 0 and its rim at 0.55.
    const TUB_SCALE = 1.5
    const WATER_Y = 0.55 * TUB_SCALE - 0.02

    // Top view of the corner bathtub rim: a square back with a curved front.
    // The water uses the same outline, so it reaches the rim on every side.
    const TUB_OUTLINE: [number, number][] = [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.59, -0.443],
      [0.559, -0.289],
      [0.509, -0.141],
      [0.439, 0],
      [0.352, 0.131],
      [0.249, 0.249],
      [0.131, 0.352],
      [0, 0.439],
      [-0.141, 0.509],
      [-0.289, 0.559],
      [-0.443, 0.59],
      [-0.6, 0.6]
    ]

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.6, 1.4, 1.9)
        controls.target.set(0, 0.35, 0)
        camera.lookAt(0, 0.35, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub-corner.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        tub.scale.setScalar(TUB_SCALE)
        scene.add(tub)
        tubRef.current = tub
      }

      // Cleanup on unmount
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={TUB_SCALE} position={[0, WATER_Y, 0]} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPoolIrregular rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // The tub is 1.2 x 1.2 units with its floor at y = 0 and its rim at 0.55.
    const TUB_SCALE = 1.5
    const WATER_Y = 0.55 * TUB_SCALE - 0.02

    // Top view of the corner bathtub rim: a square back with a curved front.
    // The water uses the same outline, so it reaches the rim on every side.
    const TUB_OUTLINE: [number, number][] = [
      [-0.6, -0.6],
      [0.6, -0.6],
      [0.59, -0.443],
      [0.559, -0.289],
      [0.509, -0.141],
      [0.439, 0],
      [0.352, 0.131],
      [0.249, 0.249],
      [0.131, 0.352],
      [0, 0.439],
      [-0.141, 0.509],
      [-0.289, 0.559],
      [-0.443, 0.59],
      [-0.6, 0.6]
    ]

    export default function App() {
      const tubRef = useRef<THREE.Group | null>(null)
      const cancelledRef = useRef(false)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.6, 1.4, 1.9)
        controls.target.set(0, 0.35, 0)
        camera.lookAt(0, 0.35, 0)

        const tub = await GLTFLoaderAsync('/models/water-tub-corner.glb', false)
        if (cancelledRef.current) {
          disposeModel(tub)
          return
        }

        tub.scale.setScalar(TUB_SCALE)
        scene.add(tub)
        tubRef.current = tub
      }

      // Cleanup on unmount
      useEffect(() => {
        cancelledRef.current = false
        return () => {
          cancelledRef.current = true
          if (tubRef.current) {
            disposeModel(tubRef.current)
            tubRef.current = null
          }
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={TUB_SCALE} position={[0, WATER_Y, 0]} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

The tub is a corner bathtub GLB (1.2 × 1.2 units, floor at `y = 0`, rim at `y = 0.55`) scaled up 1.5×. `TUB_OUTLINE` is its rim seen from above, so `shape` makes the water cover the whole basin; the pool is lifted to `WATER_Y` and its depth drops below the tub floor, where the model hides it. The rim hides the pool walls, so the water reads as filled to the top.

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| resolution | number | 128 | Height-field cells per axis, clamped to 8–512 |
| shape | `'box' \| [number, number][] \| THREE.BufferGeometry` | `'box'` | Container outline: `'box'` for the square tub, convex `[x, z]` points within -1…1, or a geometry such as `ConvexGeometry` whose vertices are projected onto XZ |
| segments | number | 160 | Subdivisions along the container outline |
| boxes | `{ position: [number, number, number]; size: [number, number, number]; color?: string }[]` | Three cubes | Cubes of different shapes floating in the pool |
| autoRipples | boolean | true | Adds a small random ripple every 1.8 seconds |
| interactive | boolean | true | Enables dragging the water surface and the boxes |
| sky | boolean | true | Draws the procedural sky dome behind the pool |
| position | Vector3 \| [number, number, number] | [0, 0, 0] | World position of the water surface centre |
| scale | number | 1 | Uniform scale of the pool: footprint, depth and floating boxes |

The sun direction is shared through the [global parameter bus](/guide/effects/global-parameters) instead of a prop, so the caustics use the same sun as the sky and the ocean:

```ts
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

The pool is modelled in its own space: the water surface centre is the origin, the outline fits into -1…1 and the floor sits 1 unit below the surface. `position` and `scale` place that whole space in the scene, so a `scale` of `3` makes the pool 6 world units wide with a 3 unit deep basin, and the floating boxes grow with it.

Each entry of `boxes` describes one block: `position` is its center, `size` its full dimensions and `color` an optional CSS color. Every box is ray traced by the water shader, so adding boxes increases the shader cost; a handful of shapes keeps the effect fast.
