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
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents, WaterPoolOutline } from 'react-three-lite'

    // The pool depth scales with the water, so the surface stays 0.7 units deep.
    const WATER_SCALE = 0.7

    // The model is 0.86 x 0.74 x 1.64 units with its floor at y = 0, its rim at
    // y = 0.53 and its inner opening 0.66 x 1.44. These scales turn that opening
    // into a 1.05 x 1.25 basin that fits under the camera, and the height keeps
    // the rim 9 cm above the surface.
    const TUB_SCALE: [number, number, number] = [1.59, 1.15, 0.868]
    const TUB_Y = 0.09 - 0.53 * TUB_SCALE[1]

    // The water follows the tub opening with a 2 cm tuck under the porcelain, so
    // the surface meets all four walls with no gap. The outline is in pool space,
    // which WaterPool scales by WATER_SCALE.
    const WATER_HALF_X = (0.33 * TUB_SCALE[0] + 0.02) / WATER_SCALE
    const WATER_HALF_Z = (0.72 * TUB_SCALE[2] + 0.02) / WATER_SCALE
    const WATER_OUTLINE: WaterPoolOutline = [
      [-WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, WATER_HALF_Z],
      [-WATER_HALF_X, WATER_HALF_Z]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components

        // A high sun keeps the refracted light crisp; every effect shares this direction.
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

        camera.position.set(1.75, 2.2, 2.0)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)

        // WaterPool draws the water only, so the sky and the sun come from SkyDome.
        // The palette matches the sky the water shader traces in its reflections.
        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // The loader component adds the tub to the scene; only its height needs
      // adjusting so the rim sits just above the surface all round.
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(0, TUB_Y, 0)
      }, [])

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
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={WATER_OUTLINE} scale={WATER_SCALE} />
          <GLTFLoader
            modelUrl="/models/water-tub.glb"
            useDraco={false}
            scale={TUB_SCALE}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPool rendererType="webgl" />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents, WaterPoolOutline } from 'react-three-lite'

    // The pool depth scales with the water, so the surface stays 0.7 units deep.
    const WATER_SCALE = 0.7

    // The model is 0.86 x 0.74 x 1.64 units with its floor at y = 0, its rim at
    // y = 0.53 and its inner opening 0.66 x 1.44. These scales turn that opening
    // into a 1.05 x 1.25 basin that fits under the camera, and the height keeps
    // the rim 9 cm above the surface.
    const TUB_SCALE: [number, number, number] = [1.59, 1.15, 0.868]
    const TUB_Y = 0.09 - 0.53 * TUB_SCALE[1]

    // The water follows the tub opening with a 2 cm tuck under the porcelain, so
    // the surface meets all four walls with no gap. The outline is in pool space,
    // which WaterPool scales by WATER_SCALE.
    const WATER_HALF_X = (0.33 * TUB_SCALE[0] + 0.02) / WATER_SCALE
    const WATER_HALF_Z = (0.72 * TUB_SCALE[2] + 0.02) / WATER_SCALE
    const WATER_OUTLINE: WaterPoolOutline = [
      [-WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, WATER_HALF_Z],
      [-WATER_HALF_X, WATER_HALF_Z]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.75, 2.2, 2.0)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)

        // WaterPool draws the water only, so the sky and the sun come from SkyDome.
        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // The loader component adds the tub to the scene; only its height needs
      // adjusting so the rim sits just above the surface all round.
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(0, TUB_Y, 0)
      }, [])

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
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
          <WaterPool shape={WATER_OUTLINE} scale={WATER_SCALE} />
          <GLTFLoader
            modelUrl="/models/water-tub.glb"
            useDraco={false}
            scale={TUB_SCALE}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

Drag inside the pool to add ripples, and drag outside the pool to orbit the camera.

The demo passes its own `shape`: the water surface traces the bathtub opening, a plain rectangle, instead of the default irregular cube outline, so the water meets all four walls with no gap along the porcelain. Pass `shape` to replace it.

`WaterPool` draws the water only. The sky and its sun come from a `SkyDome` created in `handleCreated`, whose palette matches the sky the water shader traces for reflections, so the visible sky and the reflected one line up. Dispose it on unmount together with the rest of the scene resources.

The tub around the water is a bathtub GLB loaded with the `GLTFLoader` component. It is 0.86 × 0.74 × 1.64 units with its floor at `y = 0`, its rim at `y = 0.53` and an inner opening of 0.66 × 1.44, so the demo scales it to 1.59 × 1.15 × 0.868 — a 1.05 × 1.25 basin — and drops it until the rim sits 9 cm above the surface. `WATER_OUTLINE` is that opening with a 2 cm tuck under the porcelain, so the surface meets all four walls. The model is purely visual — the shader still only traces the basin under the surface, so the shading cost does not change.

## Custom Shape

Pass an outline or any `THREE.BufferGeometry` to `shape` to replace the default irregular cube. Points are `[x, z]` pairs on the XZ plane and geometry vertices are projected onto XZ; both are reduced to their convex hull. The outline must contain the origin and stay within -1…1 so the ripples cover the whole surface. `shape="box"` gives the square tub.

This demo dips into a downloaded bathtub instead of the square tub. The outline below is the bathtub opening seen from above — a long rounded rectangle — so the water reaches the inner walls all round, and the pool is scaled and lifted to sit inside the model.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPoolIrregular />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // The tub is 1.19 x 0.56 units with its rim at y = 0.35 and its floor at y = 0.
    const TUB_SCALE = 1.7
    const TUB_SCALE_VEC: [number, number, number] = [TUB_SCALE, TUB_SCALE, TUB_SCALE]
    // The outline is normalised by half of the rim opening (0.536 units), so the
    // pool scale is that half extent in world units and the water depth matches it.
    const WATER_SCALE = 0.536 * TUB_SCALE
    const WATER_Y = 0.33 * TUB_SCALE

    // Top view of the bathtub opening: a long rounded rectangle that follows the
    // inner rim. The water uses the same outline, so it reaches the walls all round.
    const TUB_OUTLINE: [number, number][] = [
      [-1, 0],
      [-0.987, -0.106],
      [-0.945, -0.207],
      [-0.879, -0.291],
      [-0.795, -0.358],
      [-0.694, -0.399],
      [-0.588, -0.412],
      [0.513, -0.412],
      [0.619, -0.399],
      [0.72, -0.358],
      [0.804, -0.291],
      [0.871, -0.207],
      [0.981, -0.028],
      [0.981, 0.028],
      [0.871, 0.207],
      [0.804, 0.291],
      [0.72, 0.358],
      [0.619, 0.399],
      [0.513, 0.412],
      [-0.588, 0.412],
      [-0.694, 0.399],
      [-0.795, 0.358],
      [-0.879, 0.291],
      [-0.945, 0.207],
      [-0.987, 0.106]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.7, 1.35, 1.9)
        controls.target.set(0, 0.3, 0)
        camera.lookAt(0, 0.3, 0)

        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // The model has its origin in a corner, so shift it back over the water.
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(-0.595 * TUB_SCALE, 0, 0.28 * TUB_SCALE)
      }, [])

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
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={WATER_SCALE} position={[0, WATER_Y, 0]} />
          <GLTFLoader
            modelUrl="/models/bathtub.glb"
            useDraco={false}
            scale={TUB_SCALE_VEC}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPoolIrregular rendererType="webgl" />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // The tub is 1.19 x 0.56 units with its rim at y = 0.35 and its floor at y = 0.
    const TUB_SCALE = 1.7
    const TUB_SCALE_VEC: [number, number, number] = [TUB_SCALE, TUB_SCALE, TUB_SCALE]
    // The outline is normalised by half of the rim opening (0.536 units), so the
    // pool scale is that half extent in world units and the water depth matches it.
    const WATER_SCALE = 0.536 * TUB_SCALE
    const WATER_Y = 0.33 * TUB_SCALE

    // Top view of the bathtub opening: a long rounded rectangle that follows the
    // inner rim. The water uses the same outline, so it reaches the walls all round.
    const TUB_OUTLINE: [number, number][] = [
      [-1, 0],
      [-0.987, -0.106],
      [-0.945, -0.207],
      [-0.879, -0.291],
      [-0.795, -0.358],
      [-0.694, -0.399],
      [-0.588, -0.412],
      [0.513, -0.412],
      [0.619, -0.399],
      [0.72, -0.358],
      [0.804, -0.291],
      [0.871, -0.207],
      [0.981, -0.028],
      [0.981, 0.028],
      [0.871, 0.207],
      [0.804, 0.291],
      [0.72, 0.358],
      [0.619, 0.399],
      [0.513, 0.412],
      [-0.588, 0.412],
      [-0.694, 0.399],
      [-0.795, 0.358],
      [-0.879, 0.291],
      [-0.945, 0.207],
      [-0.987, 0.106]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.7, 1.35, 1.9)
        controls.target.set(0, 0.3, 0)
        camera.lookAt(0, 0.3, 0)

        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // The model has its origin in a corner, so shift it back over the water.
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(-0.595 * TUB_SCALE, 0, 0.28 * TUB_SCALE)
      }, [])

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
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
          <WaterPool
            shape={TUB_OUTLINE}
            scale={WATER_SCALE}
            position={[0, WATER_Y, 0]}
          />
          <GLTFLoader
            modelUrl="/models/bathtub.glb"
            useDraco={false}
            scale={TUB_SCALE_VEC}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

The tub is a bathtub GLB (1.19 × 0.56 units, rim at `y = 0.35`, floor at `y = 0`) scaled up 1.7× and shifted so the water sits in the middle of it. `TUB_OUTLINE` is the inner rim seen from above, so `shape` makes the water cover the whole opening; the pool is lifted to `WATER_Y`, just below the rim, and its depth drops below the tub floor, where the model hides it. The pool draws no bottom of its own: the deep floor is shaded by the water shader, so nothing pokes out under the tub.

## Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| resolution | number | 128 | Height-field cells per axis, clamped to 8–512 |
| shape | `'box' \| [number, number][] \| THREE.BufferGeometry` | Irregular cube outline | Container outline: the default skewed quadrilateral, `'box'` for the square tub, convex `[x, z]` points within -1…1, or a geometry such as `ConvexGeometry` whose vertices are projected onto XZ |
| segments | number | 160 | Subdivisions along the container outline |
| autoRipples | boolean | true | Adds a small random ripple every 1.8 seconds |
| interactive | boolean | true | Enables dragging the water surface |
| position | Vector3 \| [number, number, number] | [0, 0, 0] | World position of the water surface centre |
| scale | number | 1 | Uniform scale of the pool: footprint and depth |

The sun direction is shared through the [global parameter bus](/guide/effects/global-parameters) instead of a prop, so the reflections, the refracted light and the `SkyDome` sun all use the same direction:

```ts
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

The pool is modelled in its own space: the water surface centre is the origin, the outline fits into -1…1 and the floor sits 1 unit below the surface. `position` and `scale` place that whole space in the scene, so a `scale` of `3` makes the pool 6 world units wide with a 3 unit deep basin.
