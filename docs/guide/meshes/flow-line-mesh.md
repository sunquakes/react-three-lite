---
lang: en-US
title: Flow Line Mesh
---

## Type

Class

import FlowLineMesh from '@site/src/components/meshes/FlowLineMesh'
import FlowLineMeshOptions from '@site/src/components/meshes/FlowLineMeshOptions'

## Default Usage

<FlowLineMesh />

```tsx
import { useRef } from 'react'
import { Scene, FlowLineMesh, AxisType } from 'react-three-lite'
import * as THREE from 'three'

export default function App() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    sceneRef.current = scene
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)

    const points = [
      new THREE.Vector3(-2.000000, 0.000000, 0),
      new THREE.Vector3(-1.975377, 0.312869, 0),
      new THREE.Vector3(-1.902113, 0.618034, 0),
      new THREE.Vector3(-1.782013, 0.907981, 0),
      new THREE.Vector3(-1.618034, 1.175571, 0),
      new THREE.Vector3(-1.414214, 1.414214, 0),
      new THREE.Vector3(-1.175571, 1.618034, 0),
      new THREE.Vector3(-0.907981, 1.782013, 0),
      new THREE.Vector3(-0.618034, 1.902113, 0),
      new THREE.Vector3(-0.312869, 1.975377, 0),
      new THREE.Vector3(-0.000000, 2.000000, 0),
      new THREE.Vector3(0.312869, 1.975377, 0),
      new THREE.Vector3(0.618034, 1.902113, 0),
      new THREE.Vector3(0.907981, 1.782013, 0),
      new THREE.Vector3(1.175571, 1.618034, 0),
      new THREE.Vector3(1.414214, 1.414214, 0),
      new THREE.Vector3(1.618034, 1.175571, 0),
      new THREE.Vector3(1.782013, 0.907981, 0),
      new THREE.Vector3(1.902113, 0.618034, 0),
      new THREE.Vector3(1.975377, 0.312869, 0),
      new THREE.Vector3(2.000000, 0.000000, 0)
    ]

    const mesh = new FlowLineMesh({
      points,
      width: 0.3,
      axis: AxisType.Z,
      textureRepeat: 8,
      color: [0.0, 1.0, 1.0, 1]
    })

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

<FlowLineMeshOptions />

```tsx
import { useRef } from 'react'
import { Scene, FlowLineMesh, AxisType } from 'react-three-lite'
import * as THREE from 'three'

export default function App() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    sceneRef.current = scene
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)

    const points = [
      new THREE.Vector3(-2.000000, 0.000000, 0),
      new THREE.Vector3(-1.975377, 0.312869, 0),
      new THREE.Vector3(-1.902113, 0.618034, 0),
      new THREE.Vector3(-1.782013, 0.907981, 0),
      new THREE.Vector3(-1.618034, 1.175571, 0),
      new THREE.Vector3(-1.414214, 1.414214, 0),
      new THREE.Vector3(-1.175571, 1.618034, 0),
      new THREE.Vector3(-0.907981, 1.782013, 0),
      new THREE.Vector3(-0.618034, 1.902113, 0),
      new THREE.Vector3(-0.312869, 1.975377, 0),
      new THREE.Vector3(-0.000000, 2.000000, 0),
      new THREE.Vector3(0.312869, 1.975377, 0),
      new THREE.Vector3(0.618034, 1.902113, 0),
      new THREE.Vector3(0.907981, 1.782013, 0),
      new THREE.Vector3(1.175571, 1.618034, 0),
      new THREE.Vector3(1.414214, 1.414214, 0),
      new THREE.Vector3(1.618034, 1.175571, 0),
      new THREE.Vector3(1.782013, 0.907981, 0),
      new THREE.Vector3(1.902113, 0.618034, 0),
      new THREE.Vector3(1.975377, 0.312869, 0),
      new THREE.Vector3(2.000000, 0.000000, 0)
    ]

    const mesh = new FlowLineMesh({
      points,
      color: [0.0, 1.0, 1.0, 1],
      speed: 16,
      width: 0.4,
      axis: AxisType.Z,
      textureRepeat: 10
    })

    scene.add(mesh)
  }

  return (
    <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated} />
    </div>
  )
}
```

## Constructor Parameters

| Paramter | Props  | Type                | Default                                      | Description                                                                       |
| -------- | ------ | ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| options  | points | THREE.Vector3[]     | `[-1,0,0], [0,0.5,0], [1,0,0]`              | `optional` Array of 3D points that define the line path.                          |
|          | color  | [number, number, number, number] | [0.6, 0.96, 0.98, 1] | `optional` The color of the flow line (RGBA).                                     |
|          | speed  | number              | 1                                            | `optional` The speed of the flow animation.                                       |
|          | width  | number              | 0.05                                         | `optional` The width of the line.                                                 |
|          | axis   | AxisType            | AxisType.Z                                   | `optional` The axis the line faces. `X`, `Y`, or `Z`.                             |
