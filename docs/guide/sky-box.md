---
lang: en-US
title: SkyBox
---

## Type

Class

import SkyBox from '@site/src/components/SkyBox'

## Default Usage

<SkyBox />

```tsx
import { useEffect, useRef } from 'react'
import { Scene, SkyBox } from 'react-three-lite'
import type * as THREE from 'three'

export default function App() {
  const skyBoxRef = useRef<SkyBox | null>(null)

  const handleCreated = (scene: THREE.Scene, { camera }: { camera: THREE.Camera }) => {
    if (camera) {
      camera.position.set(0, 1.5, 3)
    }

    const skyBox = new SkyBox([
      '/images/examples/skybox/right.jpg',
      '/images/examples/skybox/left.jpg',
      '/images/examples/skybox/top.jpg',
      '/images/examples/skybox/bottom.jpg',
      '/images/examples/skybox/front.jpg',
      '/images/examples/skybox/back.jpg'
    ])
    skyBoxRef.current = skyBox
    scene.background = skyBox.scene
  }

  useEffect(() => {
    return () => {
      skyBoxRef.current?.scene.dispose()
      skyBoxRef.current = null
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

## Props

| Name  | Type              | Description                                           |
| ----- | ----------------- | ----------------------------------------------------- |
| scene | THREE.CubeTexture | The cube texture to use for THREE.Scene's background. |

## Methods

| Name        | Parameters                 | Description                                                                                       |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| constructor | (images: string[]) => void | The `images` include six images, which are the right, left, top, bottom, front, back of the cube. |
