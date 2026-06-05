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
import { Scene, GLTFLoader, useScene, SweepLight } from 'react-three-lite'

export default function App() {
  const modelRef = useRef(null)
  const sweepLightsRef = useRef([])
  const { scene, addBeforeFrame } = useScene()

  const handleLoaded = (model) => {
    modelRef.current = model

    // 收集模型中的所有网格
    const meshes = []
    model.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
      }
    })

    // 为每个网格创建扫光效果
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

  // 卸载时清理
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

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| color | number | 0x00ffff | 扫光颜色（默认青色） |
| speed | number | 1.0 | 扫光动画速度 |
| width | number | 0.3 | 扫光带宽度（0-1） |
| intensity | number | 1.5 | 光晕强度 |
| direction | number | 0 | 扫光方向轴：0=X, 1=Y, 2=Z |
| side | FrontSide \| DoubleSide | FrontSide | 渲染网格的哪一面 |

## 方法

### dispose(scene: Scene)

销毁扫光效果并从场景中移除。应在组件卸载时调用以防止内存泄漏。
