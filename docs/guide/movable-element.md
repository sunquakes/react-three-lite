---
lang: en-US
title: Movable Element
---

## Type

Class

import MovableElement from '@site/src/components/MovableElement'

## Default Usage

<MovableElement />

```tsx
import { Scene, Movable } from 'react-three-lite'
import { GLTFLoader } from 'react-three-lite'

function App() {
  const handleCreated = async (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)

    // Load model using the function version of GLTFLoader
    const model = await GLTFLoader('/models/perseverance-draco.glb', true)
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)

    // Create movable element starting at [0, 0, -1]
    const element = new Movable(model, [0, 0, -1])
    
    // Move the model to [0, 0, 0] over 10 seconds
    element.moveTo([0, 0, 0], 10000)
  }

  return (
    <Scene 
      style={{ marginTop: '10px', width: '100%', height: '300px' }} 
      onCreated={handleCreated} 
    />
  )
}
```

## Props

| Name  | Type        | Description                          |
| ----- | ----------- | ------------------------------------ |
| scene | THREE.Group | The model to be displayed and moved. |

## Methods

| Name        | Parameters                                                                       | Description                                                                 |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| constructor | (model: THREE.Group, position: [number, number, number]) => void |                                                                               |
| moveTo      | (position: [number, number, number], duration: number) => void   | `duration` is the duration from one position to another. The unit is millisecond. |
