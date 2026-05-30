---
title: 光晕效果
---

## 类型

组件

import Bloom from '@site/src/components/effects/Bloom'

## 默认用法

<Bloom />

```tsx
import * as THREE from 'three'
import { Scene, Bloom } from 'react-three-lite'

export default function BloomComponent() {
  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    camera.position.set(0, 1.5, 3)

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshLambertMaterial({ color: 0xff5500 })
    const cube0 = new THREE.Mesh(geometry, material)
    cube0.position.set(0.5, 0, 0)
    cube0.layers.set(0)
    scene.add(cube0)

    const cube1 = new THREE.Mesh(geometry, material)
    cube1.position.set(-0.5, 0, 0)
    cube1.layers.set(1)
    scene.add(cube1)
  }

  return (
    <div style={{ marginTop: '10px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated}>
        <Bloom layer={1} />
      </Scene>
    </div>
  )
}
```

## 属性

| 名称      | 类型   | 默认值 | 描述                  |
| --------- | ------ | ------ | --------------------- |
| layer     | number | 0      | `可选` 泛光所在的层。 |
| strength  | number | 1      | `可选` 泛光强度。     |
| radius    | number | 0.5    | `可选` 泛光半径。     |
| threshold | number | 0.5    | `可选` 泛光阈值。     |
