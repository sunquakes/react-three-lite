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

## Props

| Name  | Type              | Description                                           |
| ----- | ----------------- | ----------------------------------------------------- |
| scene | THREE.CubeTexture | The cube texture to use for THREE.Scene's background. |

## Methods

| Name        | Parameters                 | Description                                                                                       |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| constructor | (images: string[]) => void | The `images` include six images, which are the right, left, top, bottom, front, back of the cube. |