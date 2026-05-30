---
title: 天空盒
---

## 类型

类

import SkyBoxComponent from '@site/src/components/SkyBox'

## 默认用法

<SkyBoxComponent />

```tsx
import { useEffect, useRef } from 'react'
import { Scene, SkyBox } from 'react-three-lite'
import type * as THREE from 'three'

export default function SkyBoxComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    sceneRef.current = scene

    if (camera) {
      camera.position.set(0, 1.5, 3)
    }
  }

  useEffect(() => {
    if (sceneRef.current) {
      const skyBox = new SkyBox([
        '/images/examples/skybox/right.jpg',
        '/images/examples/skybox/left.jpg',
        '/images/examples/skybox/top.jpg',
        '/images/examples/skybox/bottom.jpg',
        '/images/examples/skybox/front.jpg',
        '/images/examples/skybox/back.jpg'
      ])
      sceneRef.current.background = skyBox.scene
    }
  }, [])

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

## 属性

| 名称  | 类型              | 描述                                                |
| ----- | ----------------- | --------------------------------------------------- |
| scene | THREE.CubeTexture | 用于 THREE.Scene 背景的立方体纹理。                 |

## 方法

| 名称        | 参数                 | 描述                                           |
| ----------- | -------------------------- | --------------------------------------------- |
| constructor | (images: string[]) => void | `images` 包含六张图片，分别是立方体的右、左、上、下、前、后。 |
