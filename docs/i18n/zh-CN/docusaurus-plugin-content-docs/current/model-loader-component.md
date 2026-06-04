---
title: 组件加载器
---

import GLTFLoaderComponent from '@site/src/components/GLTFLoaderComponent'
import FBXLoaderComponent from '@site/src/components/FBXLoaderComponent'
import OBJLoaderComponent from '@site/src/components/OBJLoaderComponent'

## 类型

组件

## GLTF 加载器

### 默认用法

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

### 属性

| 名称     | 类型                     | 默认值          | 描述                                                |
| -------- | ------------------------ | --------------- | --------------------------------------------------- |
| modelUrl | string                   |                 | `必需` 模型的 URL。                                 |
| scene    | THREE.Scene              | THREE.Scene     | `可选` 渲染模型的场景。                             |
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `可选` 模型的缩放比例。                             |
| cache    | boolean                  | true            | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。 |
| useDraco | boolean                  | false           | `可选` 是否使用 Draco 解码器。Draco 压缩的 GLTF 模型需设为 `true`。 |
| dracoDecoderPath | string           | `https://www.gstatic.com/draco/versioned/decoders/1.5.7/` | `可选` Draco 解码器路径。仅在 `useDraco` 为 `true` 时需要。 |

### 事件

| 名称        | 参数                             | 描述                           |
| ----------- | -------------------------------- | ------------------------------ |
| onProgress  | (event: ProgressEvent) => void   | 模型加载进度的回调函数。       |
| onLoaded    | (model: THREE.Group) => void     | 模型加载完成时调用的回调函数。 |

## FBX 加载器

### 默认用法

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

### 属性

| 名称     | 类型                     | 默认值          | 描述                                                |
| -------- | ------------------------ | --------------- | --------------------------------------------------- |
| modelUrl | string                   |                 | `必需` 模型的 URL。                                 |
| scene    | THREE.Scene              | THREE.Scene     | `可选` 渲染模型的场景。                             |
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `可选` 模型的缩放比例。                             |
| cache    | boolean                  | true            | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。 |

### 事件

| 名称        | 参数                             | 描述                           |
| ----------- | -------------------------------- | ------------------------------ |
| onProgress  | (event: ProgressEvent) => void   | 模型加载进度的回调函数。       |
| onLoaded    | (model: THREE.Group) => void     | 模型加载完成时调用的回调函数。 |

## OBJ 加载器

### 默认用法

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

### 属性

| 名称     | 类型                     | 默认值          | 描述                                                |
| -------- | ------------------------ | --------------- | --------------------------------------------------- |
| modelUrl | string                   |                 | `必需` 模型的 URL。                                 |
| mtlUrl   | string                   |                 | `可选` 当使用 `OBJLoader` 时，材质文件的 URL。      |
| scene    | THREE.Scene              | THREE.Scene     | `可选` 渲染模型的场景。                             |
| scale    | [number, number, number] | [1.0, 1.0, 1.0] | `可选` 模型的缩放比例。                             |
| cache    | boolean                  | true            | `可选` 是否将模型缓存到 IndexedDB 中。默认为 true。 |

### 事件

| 名称        | 参数                             | 描述                           |
| ----------- | -------------------------------- | ------------------------------ |
| onProgress  | (event: ProgressEvent) => void   | 模型加载进度的回调函数。       |
| onLoaded    | (model: THREE.Group) => void     | 模型加载完成时调用的回调函数。 |
