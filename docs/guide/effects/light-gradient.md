---
id: light-gradient
lang: en-US
title: Light Gradient
---

import LightGradient from '@site/src/components/effects/LightGradient'

## Type

Function

## Default Usage

<LightGradient />

```tsx
import { Scene, lightGradient } from 'react-three-lite'
import { useRef, useEffect } from 'react'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

function LightGradientComponent() {
  const cleanupRef = useRef<(() => void) | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light } = components
    if (!camera || !light) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.5
    })
    meshRef.current = new THREE.Mesh(geometry, material)
    scene.add(meshRef.current)

    cleanupRef.current = lightGradient(light, {
      color: '#ff6600',
      intensity: 15,
      duration: 3000
    })
  }

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
    }
  }, [])

  return (
    <Scene bgColor="#0a0a0a" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
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

## Function Signature

| Name | Parameters | Description |
|------|------------|-------------|
| lightGradient | (light: Light, options: LightGradientOptions) => () => void | Animate light properties from current values to target values. Returns a cleanup function to cancel the animation |
