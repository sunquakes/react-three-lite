---
lang: en-US
title: Function Loader
---

## Type

Function

import GLTFLoaderFunction from '@site/src/components/GLTFLoaderFunction'
import FBXLoaderFunction from '@site/src/components/FBXLoaderFunction'
import OBJLoaderFunction from '@site/src/components/OBJLoaderFunction'

## GLTF Loader

### Default Usage

<GLTFLoaderFunction />

```tsx
import { Scene, GLTFLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // Load model to scene.
    const model = await GLTFLoader('/models/perseverance-draco.glb', true)
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

### Parameters

| Name             | Type     | Default                                                    | Description                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| url              | string   |                                                            | `required` The model url.                                                                                   |
| useDraco         | boolean  | false                                                      | `optional` Whether to use Draco decoder. Set to `true` for Draco-compressed GLTF models.                    |
| dracoDecoderPath | string   | `https://www.gstatic.com/draco/versioned/decoders/1.5.7/` | `optional` The Draco decoder path. Only needed when `useDraco` is `true`.                                   |
| cache            | boolean  | true                                                       | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress       | function |                                                            | `optional` The callback function when loading the model.                                                    |

## FBX Loader

### Default Usage

<FBXLoaderFunction />

```tsx
import { Scene, FBXLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // Load model to scene.
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

### Parameters

| Name       | Type     | Default | Description                                                                                                 |
| ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| url        | string   |         | `required` The model url.                                                                                   |
| cache      | boolean  | true    | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress | function |         | `optional` The callback function when loading the model.                                                    |

## OBJ Loader

### Default Usage

<OBJLoaderFunction />

```tsx
import { Scene, OBJLoader } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const handleCreated = async (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    camera.position.set(0, 1.5, 3)

    // Load model to scene.
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

### Parameters

| Name       | Type     | Default | Description                                                                                                 |
| ---------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| url        | string   |         | `required` The model url.                                                                                   |
| mtlUrl     | string   |         | `optional` The model material url. Only `OBJLoader` needs this parameter.                                   |
| cache      | boolean  | true    | `optional` The model will be cached into the indexDB. Default is true.                                      |
| onProgress | function |         | `optional` The callback function when loading the model.                                                    |
