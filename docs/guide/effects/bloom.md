---
lang: en-US
title: Bloom
---

## Type

Component

import Bloom from '@site/src/components/effects/Bloom'

## Default Usage

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

## Props

| Name      | Type   | Default | Description                                   |
| --------- | ------ | ------- | --------------------------------------------- |
| layer     | number | 0       | `optional` The layer of the bloom effect.     |
| strength  | number | 1       | `optional` The strength of the bloom effect.  |
| radius    | number | 0.5     | `optional` The radius of the bloom effect.    |
| threshold | number | 0.5     | `optional` The threshold of the bloom effect. |
