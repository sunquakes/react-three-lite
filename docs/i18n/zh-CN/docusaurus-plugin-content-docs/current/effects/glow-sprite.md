---
lang: zh-CN
title: 光晕精灵
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import GlowSprite from '@site/src/components/effects/GlowSprite'

一个始终朝向相机的光点，由程序生成的径向渐变贴图与叠加混合构成。它永远不会背对观察者，且只消耗一个四边形，适合点状高亮：远处行星、信标、信号源或镜头光斑。

传入 `pulsePeriod` 可让精灵自行呼吸 —— 信标不需要动画循环。`phase` 用于错开多个脉冲精灵。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <GlowSprite />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, GlowSprite } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    interface DotConfig {
      position: [number, number, number]
      size: number
      color: number
      tint: number
      opacity: number
      pulsePeriod?: number
      phase?: number
    }

    // 几个不同尺度的光点：淡蓝色的地球和两颗较暗的星，其中一颗像信标一样
    // 自行脉冲 —— 不需要动画循环。
    const dots: DotConfig[] = [
      { position: [0, 1, 0], size: 3.2, color: 0x8ecbff, tint: 0xbcdfff, opacity: 0.9 },
      { position: [-3.4, -0.8, -2], size: 1.4, color: 0xffb066, tint: 0xffd9a8, opacity: 0.8, pulsePeriod: 2.2, phase: 0.3 },
      { position: [3.6, 2.4, -4], size: 2.2, color: 0x9ce8ff, tint: 0xd8f4ff, opacity: 0.85 }
    ]

    export default function App() {
      const dotsRef = useRef<GlowSprite[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        dots.forEach((dot) => {
          const sprite = new GlowSprite({
            size: dot.size,
            color: dot.color,
            tint: dot.tint,
            opacity: dot.opacity,
            pulsePeriod: dot.pulsePeriod,
            phase: dot.phase
          })
          sprite.position.set(...dot.position)
          scene.add(sprite)
          dotsRef.current.push(sprite)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          dotsRef.current.forEach((sprite) => sprite.dispose())
          dotsRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(8, 10, 20)"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <GlowSprite rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, GlowSprite } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    interface DotConfig {
      position: [number, number, number]
      size: number
      color: number
      tint: number
      opacity: number
      pulsePeriod?: number
      phase?: number
    }

    // 几个不同尺度的光点：淡蓝色的地球和两颗较暗的星，其中一颗像信标一样
    // 自行脉冲 —— 不需要动画循环。
    const dots: DotConfig[] = [
      { position: [0, 1, 0], size: 3.2, color: 0x8ecbff, tint: 0xbcdfff, opacity: 0.9 },
      { position: [-3.4, -0.8, -2], size: 1.4, color: 0xffb066, tint: 0xffd9a8, opacity: 0.8, pulsePeriod: 2.2, phase: 0.3 },
      { position: [3.6, 2.4, -4], size: 2.2, color: 0x9ce8ff, tint: 0xd8f4ff, opacity: 0.85 }
    ]

    export default function App() {
      const dotsRef = useRef<GlowSprite[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        dots.forEach((dot) => {
          const sprite = new GlowSprite({
            size: dot.size,
            color: dot.color,
            tint: dot.tint,
            opacity: dot.opacity,
            pulsePeriod: dot.pulsePeriod,
            phase: dot.phase
          })
          sprite.position.set(...dot.position)
          scene.add(sprite)
          dotsRef.current.push(sprite)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          dotsRef.current.forEach((sprite) => sprite.dispose())
          dotsRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(8, 10, 20)"
          onCreated={handleCreated}
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| color | number | 0x8ecbff | 径向渐变光晕的颜色 |
| tint | number | 0xbcdfff | 与贴图相乘的颜色，让同一张贴图呈现多种色调 |
| size | number | 3.2 | 精灵的世界尺寸 |
| opacity | number | 0.9 | 全局不透明度系数（0-1） |
| resolution | number | 128 | 生成光晕贴图的像素尺寸 |
| pulsePeriod | number | — | 一个呼吸周期的秒数。设置后光晕自行轻微脉冲 —— 缩放摆动约 12%，不透明度在配置值的 75% 到 100% 之间 —— 无需每帧代码 |
| phase | number | 0 | 用于错开脉冲精灵的相位偏移，取值 0-1 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: GlowSpriteOptions) | 创建精灵。它继承自 `THREE.Sprite`，定位后加入场景 |
| dispose | () => void | 销毁生成的贴图与材质并从场景中分离 |
