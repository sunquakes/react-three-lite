---
lang: en-US
title: Wave Circle Mesh
---

## Type

Class

import WaveCircleMesh from '@site/src/components/meshes/WaveCircleMesh'
import WaveCircleMeshOptions from '@site/src/components/meshes/WaveCircleMeshOptions'

## Default Usage

<WaveCircleMesh />

```tsx
import { useRef } from 'react'
import { Scene, WaveCircleMesh } from 'react-three-lite'
import type * as THREE from 'three'

export default function App() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    sceneRef.current = scene
    camera.position.set(0, 2, 0)

    const mesh = new WaveCircleMesh()
    scene.add(mesh)
  }

  return (
    <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated} />
    </div>
  )
}
```

## Custom Options

<WaveCircleMeshOptions />

```tsx
import { useRef } from 'react'
import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
import type * as THREE from 'three'

export default function App() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    sceneRef.current = scene
    camera.position.set(2, 0, 0)

    const mesh = new WaveCircleMesh({
      radius: 0.5,
      color: [0.98, 0.61, 0.6, 1],
      speed: 2,
      verticalAxis: AxisType.X
    })
    scene.add(mesh)
    mesh.position.set(0, 0.5, 0)
  }

  return (
    <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated} />
    </div>
  )
}
```

## Constructor Parameters

| Paramter | Props        | Type                             | Default              | Description                                                                       |
| -------- | ------------ | -------------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| options  | radius       | number                           | 1                    | `optional` The radius of the wave circle.                                         |
|          | color        | [number, number, number, number] | [0.6, 0.96, 0.98, 1] | `optional` The color of the wave circle.                                          |
|          | speed        | number                           | 1                    | `optional` The speed of the circle wave.                                          |
|          | verticalAxis | AxisType                         | AxisType.Y           | `optional` The circle face vertical axis. The type AxisType is `X` or `Y` or `Z`. |
