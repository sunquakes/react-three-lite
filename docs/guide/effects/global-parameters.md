---
id: global-parameters
lang: en-US
title: Global Parameters
---

## Type

Class with a process-wide `globalParameterBus` instance.

## Usage

Effects such as `SkyDome`, `Water`, `WaterPool` and `HeightFog` share one sun. Instead of passing a `sunDirection` prop to each of them, set it once on the global parameter bus:

```tsx
import * as THREE from 'three'
import { Scene, SkyDome, Water, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

function App() {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    globalParameterBus.set('sunDirection', new THREE.Vector3(-0.58, 0.1, -0.81))

    const { camera } = components
    camera.position.set(0, 1.5, 3)

    scene.add(new SkyDome())
  }

  return (
    <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
      <Water />
    </Scene>
  )
}
```

`set` normalizes the vector and notifies every effect, so the sun disc, the water surface, the pool reflections and the fog inscattering update immediately without re-rendering the React tree.

Changing the sun at runtime only needs another `set` call:

```tsx
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

## Parameters

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| sunDirection | THREE.Vector3 | [-0.78, 0.2, -0.6], normalized | World-space direction pointing from the scene towards the sun |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| get | (key: keyof GlobalParameters) => GlobalParameters[K] | Returns the current value. Do not mutate it, use `set` instead |
| set | (key: keyof GlobalParameters, value: GlobalParameters[K]) => void | Normalizes vector values, stores them and notifies subscribers |
| subscribe | (key: keyof GlobalParameters, listener: (value, previous) => void) => () => void | Subscribes to one parameter and returns an unsubscribe function |
| reset | () => void | Restores every parameter to its default value and notifies subscribers |

## Consumed by

- [SkyDome](/guide/effects/sky-dome) - sun disc position
- [Water](/guide/effects/water) - specular sun
- [WaterPool](/guide/effects/water-pool) - reflections and refracted light
- [HeightFog](/guide/effects/height-fog) - directional inscattering

## Notes

- The bus is process-wide, so every `Scene` on the page sees the same sun. Set it once per page or per app.
- Effects read the current value when they are created and stay subscribed, so the direction can be changed at any time.
