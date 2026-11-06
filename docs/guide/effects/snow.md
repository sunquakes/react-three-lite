---
lang: en-US
title: Snow
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Snow from '@site/src/components/effects/Snow'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Snow />

    ```tsx
    import { Scene, Snow } from 'react-three-lite'
    import * as THREE from 'three'

    export default function App() {
      const handleCreated = (scene: THREE.Scene) => {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -1.4
        scene.add(ground)
      }

      return (
        <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          <Snow
            count={2000}
            speed={0.5}
            color={0xffffff}
            range={16}
            height={14}
            accumulate
            accumulationThickness={0.12}
            accumulationDuration={6}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Snow rendererType="webgl" />

    ```tsx
    import { Scene, Snow } from 'react-three-lite'
    import * as THREE from 'three'

    export default function App() {
      const handleCreated = (scene: THREE.Scene) => {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -1.4
        scene.add(ground)
      }

      return (
        <Scene bgColor="rgb(40, 42, 54)" rendererType="webgl" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          <Snow
            count={2000}
            speed={0.5}
            color={0xffffff}
            range={16}
            height={14}
            accumulate
            accumulationThickness={0.12}
            accumulationDuration={6}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Accumulation

Set `accumulate` to let the snow settle on the upward-facing surfaces of the scene. Every eligible mesh gets a snow shell that is pushed out along its normals, growing from flat tops down to steeper slopes until it reaches `accumulationThickness` after `accumulationDuration` seconds — the layer never melts, it stays at full thickness.

- All scene meshes are detected automatically, including models and tiles added later.
- Pass `accumulationTargets` to restrict accumulation to specific objects.
- Back-side (sky boxes), transparent, instanced and skinned meshes are skipped.

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| count | number | 3000 | Number of snowflakes |
| color | string \| number \| Color | 0xffffff | Snowflake color |
| speed | number | 0.5 | Falling speed multiplier |
| range | number | 20 | Horizontal distribution range |
| height | number | 15 | Falling height range |
| windX | number | 0.2 | Wind force on X axis |
| windZ | number | 0.1 | Wind force on Z axis |
| turbulence | number | 0.8 | Strength of the wind field turbulence; 0 falls back to a uniform drift |
| opacity | number | 0.9 | Snowflake opacity |
| size | number | 1 | Snowflake size multiplier |
| accumulate | boolean | false | Enable snow accumulation on scene meshes |
| accumulationTargets | Object3D \| Object3D[] | – | Objects the snow settles on; all eligible scene meshes when omitted |
| accumulationThickness | number | 0.1 | Maximum layer thickness in world units |
| accumulationDuration | number | 6 | Seconds the layer needs to reach full thickness |
| accumulationColor | string \| number \| Color | 0xffffff | Snow layer color |
