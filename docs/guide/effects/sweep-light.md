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
import { Scene, GLTFLoaderAsync, SweepLight } from 'react-three-lite'
import type * as THREE from 'three'

export default function App() {
  const sweepLightRef = useRef<SweepLight | null>(null)

  const handleCreated = async (scene: THREE.Scene) => {
    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)

    sweepLightRef.current = new SweepLight(model)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sweepLightRef.current?.dispose()
      sweepLightRef.current = null
    }
  }, [])

  return (
    <Scene bgColor="#0a0a0a" onCreated={handleCreated} />
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
| loop | LoopOnce \| LoopRepeat \| LoopPingPong | LoopRepeat | Animation loop type |

## Methods

### play()

Play or resume the animation. If paused, resumes from the paused position. If stopped, starts from the beginning.

### pause()

Pause the animation at the current frame. Call `play()` to resume.

### stop()

Stop the animation and reset to the initial state. Call `play()` to restart from the beginning.

### dispose()

Dispose sweep light and remove from scene. Should be called on component unmount to prevent memory leaks.
