---
id: light-gradient
lang: en-US
title: Light Gradient
---

import LightGradient from '@site/src/components/effects/LightGradient'

## Type

Class

## Default Usage

<LightGradient />

```tsx
import { Scene, LightGradient } from 'react-three-lite'
import { useRef, useEffect } from 'react'
import type { SceneComponents } from 'react-three-lite'
import * as THREE from 'three'

function App() {
  const gradientRef = useRef<LightGradient | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const isBrightRef = useRef(true)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light } = components
    if (!camera || !light) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.5
    })
    meshRef.current = new THREE.Mesh(geometry, material)
    meshRef.current.position.y = 0.75
    scene.add(meshRef.current)

    const loopGradient = () => {
      if (isBrightRef.current) {
        gradientRef.current = new LightGradient(light, {
          intensity: 20,
          duration: 4000,
          onComplete: () => {
            isBrightRef.current = false
            loopGradient()
          }
        })
      } else {
        gradientRef.current = new LightGradient(light, {
          intensity: 2,
          duration: 4000,
          onComplete: () => {
            isBrightRef.current = true
            loopGradient()
          }
        })
      }
    }

    loopGradient()
  }

  useEffect(() => {
    return () => {
      gradientRef.current?.dispose()
      gradientRef.current = null
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
    }
  }, [])

  return (
    <Scene style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| color | string \| number | - | Target light color (hex string or number) |
| intensity | number | - | Target light intensity |
| duration | number | 1000 | Duration of the gradient animation in milliseconds |
| onComplete | () => void | - | Callback when animation completes |

## Constructor

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (light: Light, options?: LightGradientOptions) | Create a new LightGradient instance and start the animation |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| dispose | () => void | Stop the gradient animation and release resources |
