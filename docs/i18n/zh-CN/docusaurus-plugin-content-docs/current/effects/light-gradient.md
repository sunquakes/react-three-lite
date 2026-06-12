---
lang: zh-CN
title: 灯光渐变
---

import LightGradient from '@site/src/components/effects/LightGradient'

## 类型

类

## 默认用法

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

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| color | string \| number | - | 目标灯光颜色（十六进制字符串或数字） |
| intensity | number | - | 目标灯光强度 |
| duration | number | 1000 | 渐变动画持续时间（毫秒） |
| onComplete | () => void | - | 动画完成时的回调函数 |

## 构造函数

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (light: Light, options?: LightGradientOptions) | 创建 LightGradient 实例并开始动画 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| dispose | () => void | 停止渐变动画并释放资源 |
