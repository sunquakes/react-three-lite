---
lang: en-US
title: Sweep Light
---

## Type

Class

import SweepLightComponent from '@site/src/components/effects/SweepLight'

## Default Usage

<SweepLightComponent />

```tsx
import { useRef, useEffect } from 'react'
import { Scene, GLTFLoader, useScene, SweepLight } from 'react-three-lite'

export default function App() {
  const modelRef = useRef(null)
  const sweepLightsRef = useRef([])
  const { scene, addBeforeFrame } = useScene()

  const handleLoaded = (model) => {
    modelRef.current = model

    // Collect all meshes from the model
    const meshes = []
    model.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })

    // Create sweep light for each mesh
    meshes.forEach((mesh) => {
      const sweepLight = new SweepLight(scene, mesh, addBeforeFrame, {
        color: 0x00ffff,
        speed: 1.0,
        width: 0.5,
        intensity: 2.0,
        direction: 0,
      })
      sweepLightsRef.current.push(sweepLight)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sweepLightsRef.current.forEach((sweepLight) => {
        sweepLight.dispose(scene)
      })
    }
  }, [])

  return (
    <Scene>
      <GLTFLoader
        modelUrl="/models/perseverance-draco.glb"
        onLoaded={handleLoaded}
        scale={[0.01, 0.01, 0.01]}
      />
    </Scene>
  )
}
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| color | number | 0x00ffff | Sweep light color (cyan by default) |
| speed | number | 1.0 | Sweep animation speed |
| width | number | 0.3 | Sweep band width (0-1) |
| intensity | number | 1.5 | Light glow intensity |
| direction | number | 0 | Sweep direction axis: 0=X, 1=Y, 2=Z |
| side | FrontSide \| DoubleSide | FrontSide | Which side of the mesh to render |

## Methods

### dispose(scene: Scene)

Dispose sweep light and remove from scene. Should be called on component unmount to prevent memory leaks.
