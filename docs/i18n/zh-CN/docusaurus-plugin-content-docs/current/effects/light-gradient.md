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
