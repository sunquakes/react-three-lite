---
lang: zh-CN
title: 扫光效果
---

## 类型

类

import SweepLightComponent from '@site/src/components/effects/SweepLight'

## 默认用法

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

  // 卸载时清理
  useEffect(() => {
    return () => {
      sweepLightRef.current?.dispose()
      sweepLightRef.current = null
    }
  }, [])

  return (
    <Scene
      bgColor="#0a0a0a"
      onCreated={handleCreated}
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
    />
  )
}
```

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| color | number | 0x00ffff | 扫光颜色（默认青色） |
| speed | number | 1.0 | 扫光动画速度 |
| width | number | 0.3 | 扫光带宽度（0-1） |
| intensity | number | 1.5 | 光晕强度 |
| direction | number | 0 | 扫光方向轴：0=X, 1=Y, 2=Z |
| loop | LoopOnce \| LoopRepeat \| LoopPingPong | LoopRepeat | 动画循环类型 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (model: THREE.Object3D, options?: SweepLightOptions) | 在模型上创建扫光效果 |
| play | () => void | 播放或继续动画。如果处于暂停状态，则从暂停位置继续；如果已停止，则从头开始播放。 |
| pause | () => void | 暂停在当前帧。调用 `play()` 可继续播放。 |
| stop | () => void | 停止动画并重置到初始状态。调用 `play()` 可从头开始播放。 |
| dispose | () => void | 销毁扫光效果并从场景中移除。应在组件卸载时调用以防止内存泄漏。 |
