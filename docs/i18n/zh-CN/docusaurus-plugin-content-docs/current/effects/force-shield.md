---
lang: zh-CN
title: 能量护盾
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import ForceShield from '@site/src/components/effects/ForceShield'

## 类型

类

包裹球体的六边形能量护盾。表面由菲涅尔边缘、两层流动噪声和三平面六边形网格叠加而成，降下时通过噪声溶解。命中效果存放在 6 槽环形缓冲区中，每次命中都会绘制扩散环和接触高亮，之后无需 CPU 再次介入着色器。生命值降低时护盾会逐渐偏红。

该类自带动画：时间、溶解与命中计时都在 `onBeforeRender` 中推进，无需用户逐帧更新。

## 默认用法

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <ForceShield />
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <ForceShield rendererType="webgl" />
  </TabItem>
</Tabs>

```tsx
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, ForceShield } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
  const shieldRef = useRef<ForceShield | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 0.8, 4.6)
    camera.lookAt(0, 0, 0)

    const shield = new ForceShield({ radius: 1.8 })
    scene.add(shield)
    shieldRef.current = shield

    // 在表面某点触发一次命中
    shield.hit(new THREE.Vector3(0, 0.6, 1.7))
  }

  // 卸载时清理
  useEffect(() => {
    return () => {
      shieldRef.current?.dispose()
      shieldRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| radius | number | `1.8` | 球体半径。 |
| active | boolean | `true` | 是否以展开状态开始。`false` 表示初始完全溶解。 |
| reveal | number | - | 冻结溶解进度（`0` 完全可见，`1` 完全溶解），会覆盖 `active` 与自动动画。 |
| revealSpeed | number | `3.5` | 自动溶解与展开动画的速度。 |
| color | ColorRepresentation | `0x26aeff` | 护盾基础颜色。 |
| opacity | number | `0.76` | 表面整体不透明度。 |
| hexScale | number | `3` | 六边形网格密度。 |
| hexOpacity | number | `0.13` | 六边形单元的亮度。 |
| showHex | boolean | `true` | 是否绘制六边形网格。 |
| edgeWidth | number | `0.06` | 六边形接缝宽度。 |
| fresnelPower | number | `1.8` | 菲涅尔衰减指数。 |
| fresnelStrength | number | `1.75` | 菲涅尔边缘亮度。 |
| fadeStart | number | `0` | 物体空间 `y` 低于该值时护盾逐渐消失，`-1` 关闭渐隐。 |
| flashSpeed | number | `0.6` | 单元闪烁速度。 |
| flashIntensity | number | `0.11` | 单元闪烁亮度。 |
| noiseScale | number | `1.3` | 溶解噪声缩放。 |
| noiseEdgeColor | ColorRepresentation | `0x26aeff` | 溶解边缘颜色。 |
| noiseEdgeWidth | number | `0.02` | 溶解边缘宽度。 |
| noiseEdgeIntensity | number | `10` | 溶解边缘亮度。 |
| noiseEdgeSmoothness | number | `0.5` | 溶解边缘锐度。 |
| flowScale | number | `2.4` | 流动噪声缩放。 |
| flowSpeed | number | `1.13` | 流动噪声速度。 |
| flowIntensity | number | `4` | 流动噪声亮度。 |
| hitRingSpeed | number | `1.75` | 命中扩散环速度。 |
| hitRingWidth | number | `0.12` | 命中扩散环厚度。 |
| hitMaxRadius | number | `0.85` | 命中扩散环的最大角半径。 |
| hitDuration | number | `1.8` | 命中效果持续的秒数。 |
| hitIntensity | number | `4.1` | 命中效果亮度。 |
| hitImpactRadius | number | `0.3` | 接触高亮的角半径。 |
| hitDamage | number | `5` | 每次命中扣除的生命值百分比。 |
| life | number | `1` | 初始生命值（`1` 完好，`0` 耗尽）。数值越低护盾越偏红。 |

## 属性

| 名称 | 类型 | 描述 |
|------|------|------|
| active | boolean | 护盾是否展开。赋值会触发自动溶解或展开。 |
| reveal | number | 当前溶解进度（`0` 完全可见，`1` 完全溶解）。赋值会冻结动画。 |
| life | number | 当前生命值，范围 `0`-`1`。 |
| shieldRadius | number | 构造时传入的半径。 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: ForceShieldOptions) => void | 创建护盾网格，不会自动加入场景。 |
| setActive | (active: boolean) => void | 展开或溶解护盾，并恢复自动动画。 |
| hit | (point?: THREE.Vector3, damage?: number) => void | 在世界坐标点触发命中（默认球面随机点），并扣除 `damage` 百分比的生命值（默认使用 `hitDamage`）。 |
| dispose | () => void | 从父级移除护盾并释放几何体与材质。 |
