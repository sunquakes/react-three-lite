---
lang: en-US
title: Component Loader
---

import GLTFLoaderComponent from '@site/src/components/GLTFLoaderComponent'
import FBXLoaderComponent from '@site/src/components/FBXLoaderComponent'
import OBJLoaderComponent from '@site/src/components/OBJLoaderComponent'

## Type

Component

## GLTF Loader

### Default Usage

<GLTFLoaderComponent />

```tsx
import { Scene, GLTFLoader } from 'react-three-lite'

function App() {
  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)
  }

  return (
    <Scene 
      style={{ marginTop: '10px', width: '100%', height: '300px' }} 
      onCreated={handleCreated}
    >
      <GLTFLoader modelUrl="/models/perseverance-draco.glb" scale={[0.8, 0.8, 0.8]} useDraco />
    </Scene>
  )
}
```

### Props

| Name     | Type                     | Default         | Description                                           |
| -------- | ------------------------ | --------------- | ----------------------------------------------------- |
| modelUrl | string                   |                 | `required` The model url.                            |
| scene    | THREE.Scene              | THREE.Scene     | `optional` The Scene where the model will be rendered.|
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `optional` The scale of the model.                   |
| cache    | boolean                  | true            | `optional` The model will be cached into the indexDB. |
| useDraco | boolean                  | false           | `optional` Whether to use Draco decoder. Set to `true` for Draco-compressed GLTF models. |
| dracoDecoderPath | string           | `https://www.gstatic.com/draco/versioned/decoders/1.5.7/` | `optional` The Draco decoder path. Only needed when `useDraco` is `true`. |

### Events

| Name       | Parameters                           | Description                                     |
| ---------- | ------------------------------------ | ----------------------------------------------- |
| onProgress | (event: ProgressEvent) => void       | The callback function when loading the model.   |
| onLoaded   | (model: THREE.Group) => void         | The callback function when the model is loaded. |

## FBX Loader

### Default Usage

<FBXLoaderComponent />

```tsx
import { Scene, FBXLoader } from 'react-three-lite'

function App() {
  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)
  }

  return (
    <Scene 
      style={{ marginTop: '10px', width: '100%', height: '300px' }} 
      onCreated={handleCreated}
    >
      <FBXLoader modelUrl="/models/perseverance.fbx" scale={[0.8, 0.8, 0.8]} />
    </Scene>
  )
}
```

### Props

| Name     | Type                     | Default         | Description                                           |
| -------- | ------------------------ | --------------- | ----------------------------------------------------- |
| modelUrl | string                   |                 | `required` The model url.                            |
| scene    | THREE.Scene              | THREE.Scene     | `optional` The Scene where the model will be rendered.|
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `optional` The scale of the model.                   |
| cache    | boolean                  | true            | `optional` The model will be cached into the indexDB. |

### Events

| Name       | Parameters                           | Description                                     |
| ---------- | ------------------------------------ | ----------------------------------------------- |
| onProgress | (event: ProgressEvent) => void       | The callback function when loading the model.   |
| onLoaded   | (model: THREE.Group) => void         | The callback function when the model is loaded. |

## OBJ Loader

### Default Usage

<OBJLoaderComponent />

```tsx
import { Scene, OBJLoader } from 'react-three-lite'

function App() {
  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)
  }

  return (
    <Scene 
      style={{ marginTop: '10px', width: '100%', height: '300px' }} 
      onCreated={handleCreated}
    >
      <OBJLoader
        modelUrl="/models/obj/perseverance.obj"
        mtlUrl="/models/obj/perseverance.mtl"
        scale={[0.8, 0.8, 0.8]}
      />
    </Scene>
  )
}
```

### Props

| Name     | Type                     | Default         | Description                                           |
| -------- | ------------------------ | --------------- | ----------------------------------------------------- |
| modelUrl | string                   |                 | `required` The model url.                            |
| mtlUrl   | string                   |                 | `optional` The material url for OBJ models.           |
| scene    | THREE.Scene              | THREE.Scene     | `optional` The Scene where the model will be rendered.|
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `optional` The scale of the model.                   |
| cache    | boolean                  | true            | `optional` The model will be cached into the indexDB. |

### Events

| Name       | Parameters                           | Description                                     |
| ---------- | ------------------------------------ | ----------------------------------------------- |
| onProgress | (event: ProgressEvent) => void       | The callback function when loading the model.   |
| onLoaded   | (model: THREE.Group) => void         | The callback function when the model is loaded. |
