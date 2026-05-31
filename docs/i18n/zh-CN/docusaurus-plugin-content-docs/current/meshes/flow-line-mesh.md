---
title: 流动线网格
---

## 类型

类

import FlowLineMesh from '@site/src/components/meshes/FlowLineMesh'
import FlowLineMeshOptions from '@site/src/components/meshes/FlowLineMeshOptions'

## 默认用法

<FlowLineMesh />

```tsx
import { Scene, FlowLineMesh, AxisType } from 'react-three-lite'
import * as THREE from 'three'

function App() {
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

  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)

    const mesh = new FlowLineMesh({
      points,
      width: 0.3,
      axis: AxisType.Z,
      textureRepeat: 8,
      speed: 16,
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

## 自定义选项

<FlowLineMeshOptions />

```tsx
import { Scene, FlowLineMesh, AxisType } from 'react-three-lite'
import * as THREE from 'three'

function App() {
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

  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)

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

## 构造函数参数

| 参数    | 属性          | 类型                             | 默认值                                       | 描述                                                                            |
| ------- | ------------- | -------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| options | points        | THREE.Vector3[]                  | `[-1,0,0], [0,0.5,0], [1,0,0]`              | `可选` 定义线路径的所有 3D 坐标点数组。                                         |
|         | color         | [number, number, number, number] | [0.6, 0.96, 0.98, 1]                        | `可选` 流动线的颜色（RGBA）。                                                   |
|         | speed         | number                           | 1                                            | `可选` 流动动画的速度。                                                         |
|         | width         | number                           | 0.05                                         | `可选` 线的宽度。                                                               |
|         | axis          | AxisType                         | AxisType.Z                                   | `可选` 线的朝向轴。`X`、`Y` 或 `Z`。                                            |
|         | textureRepeat | number                           | 1                                            | `可选` 纹理重复次数。                                                           |
