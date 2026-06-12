---
lang: zh-CN
title: 灯光渐变
---

import LightGradient from '@site/src/components/effects/LightGradient'

## 类型

函数

## 默认用法

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

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| color | string \| number | - | 目标灯光颜色（十六进制字符串或数字） |
| intensity | number | - | 目标灯光强度 |
| duration | number | 1000 | 渐变动画持续时间（毫秒） |
| onComplete | () => void | - | 动画完成时的回调函数 |

## 函数签名

| 名称 | 参数 | 描述 |
|------|------|------|
| lightGradient | (light: Light, options: LightGradientOptions) => () => void | 将灯光属性从当前值渐变到目标值。返回一个清理函数用于取消动画 |
