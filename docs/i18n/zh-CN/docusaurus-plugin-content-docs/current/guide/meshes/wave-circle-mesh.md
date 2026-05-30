---
title: 波动圆网格
---

## 类型

类

import WaveCircleMesh from '@site/src/components/meshes/WaveCircleMesh'
import WaveCircleMeshOptions from '@site/src/components/meshes/WaveCircleMeshOptions'

## 默认用法

<WaveCircleMesh />

```tsx
import { useRef } from 'react'
import { Scene, WaveCircleMesh } from 'react-three-lite'
import type * as THREE from 'three'

export default function WaveCircleMeshComponent() {
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

## 自定义选项

<WaveCircleMeshOptions />

```tsx
import { useRef } from 'react'
import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
import type * as THREE from 'three'

export default function WaveCircleMeshOptionsComponent() {
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

## 构造函数参数

| 参数    | 属性          | 类型                             | 默认值              | 描述                                                |
| ------- | ------------ | -------------------------------- | -------------------- | --------------------------------------------------- |
| options | radius       | number                           | 1                    | `可选` 波动圆的半径。                               |
|         | color        | [number, number, number, number] | [0.6, 0.96, 0.98, 1] | `可选` 波动圆的颜色。                               |
|         | speed        | number                           | 1                    | `可选` 圆波动的速度。                               |
|         | verticalAxis | AxisType                         | AxisType.Y           | `可选` 圆面垂直轴。AxisType 类型是 `X`、`Y` 或 `Z`。|
