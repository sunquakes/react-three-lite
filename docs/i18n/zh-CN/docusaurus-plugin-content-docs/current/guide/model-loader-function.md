---
title: 函数加载器
---

## 类型

函数

import GLTFLoaderFunction from '@site/src/components/GLTFLoaderFunction'
import FBXLoaderFunction from '@site/src/components/FBXLoaderFunction'
import OBJLoaderFunction from '@site/src/components/OBJLoaderFunction'

## GLTF 加载器

### 默认用法

<GLTFLoaderFunction />

```tsx
import { Scene, GLTFLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // 加载模型到场景
    const model = await GLTFLoader('/models/perseverance.glb')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

## FBX 加载器

### 默认用法

<FBXLoaderFunction />

```tsx
import { Scene, FBXLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // 加载模型到场景
    const model = await FBXLoader('/models/perseverance.fbx')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

## OBJ 加载器

### 默认用法

<OBJLoaderFunction />

```tsx
import { Scene, OBJLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // 加载模型到场景
    const model = await OBJLoader('/models/obj/perseverance.obj', '/models/obj/perseverance.mtl')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

## 参数

| 名称       | 类型     | 默认值 | 描述                                                                                                 |
| ---------- | -------- | ------ | ---------------------------------------------------------------------------------------------------- |
| url        | string   |        | `必需` 模型的 URL。                                                                                  |
| mtlUrl     | string   |        | `可选` 模型的材质 URL。只有 `OBJLoader` 需要此参数。                                                 |
| cache      | boolean  | true   | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。                                                  |
| onProgress | function |        | `可选` 模型加载进度的回调函数。                                                                      |
