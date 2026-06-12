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
import { Scene } from 'react-three-lite'
import { useRef, useEffect } from 'react'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

function App() {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const animFrameRef = useRef<number | null>(null)

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

    const minIntensity = 2
    const maxIntensity = 20
    const duration = 8000

    const startTime = performance.now()
    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.sin((elapsed / duration) * Math.PI * 2)
      light.intensity = (minIntensity + maxIntensity) / 2 + t * (maxIntensity - minIntensity) / 2
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
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

## Function Signature

| Name | Parameters | Description |
|------|------------|-------------|
| lightGradient | (light: Light, options: LightGradientOptions) => () => void | Animate light properties from current values to target values. Returns a cleanup function to cancel the animation |
