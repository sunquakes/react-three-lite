---
id: model-rotator
lang: en-US
title: Model Rotator
---

import ModelRotator from '@site/src/components/ModelRotator'

## Type

Class

## Default Usage

<ModelRotator />

```tsx
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, ModelRotator, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

function App() {
  const rotatorRef = useRef<ModelRotator | null>(null)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.position.set(0, 0, 0)
    scene.add(model)

    rotatorRef.current = new ModelRotator(model, {
      axis: 'y',
      speed: 0.5,
      autoStart: true,
    })
  }

  useEffect(() => {
    return () => {
      rotatorRef.current?.dispose()
      rotatorRef.current = null
    }
  }, [])

  return (
    <Scene bgColor="#1a1a2e" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| axis | 'x' \| 'y' \| 'z' | 'y' | Rotation axis |
| speed | number | 0.5 | Rotation speed in radians per second |
| autoStart | boolean | true | Auto-start rotation on creation |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (target: THREE.Object3D, options?: ModelRotatorOptions) | Create a model rotator for 360 degree display |
| play | () => void | Start or resume rotation |
| pause | () => void | Pause rotation at current position |
| stop | () => void | Stop rotation and reset to initial state |
| setSpeed | (speed: number) => void | Set rotation speed |
| setAxis | (axis: 'x' \| 'y' \| 'z') => void | Set rotation axis |
| dispose | () => void | Dispose rotator and release resources |
