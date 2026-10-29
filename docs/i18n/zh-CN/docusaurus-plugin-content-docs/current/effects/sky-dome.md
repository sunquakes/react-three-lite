---
lang: zh-CN
title: 渐变天空穹顶
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SkyDome from '@site/src/components/effects/SkyDome'

一个用来替代场景背景的渐变天空球：从地平线到天顶的四段色带，再加上围绕可配置太阳方向的宽光晕与明亮日轮。穹顶以 `BackSide` 从内部渲染且不写深度，因此看起来始终像无限远的天空。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SkyDome />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, SkyDome } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components

        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        skyRef.current = new SkyDome()
        scene.add(skyRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SkyDome rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, SkyDome } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components

        camera.position.set(0, 0.8, 7)
        camera.lookAt(0, 0.8, 0)

        skyRef.current = new SkyDome()
        scene.add(skyRef.current)
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
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
| radius | number | 420 | 穹顶球体半径，应大于场景中的所有内容 |
| horizonColor | number | 0xf27536 | 地平线色带的颜色 |
| lowerSkyColor | number | 0x803624 | 地平线上方的颜色 |
| upperSkyColor | number | 0x260f13 | 中间过渡色带的颜色 |
| zenithColor | number | 0x060409 | 穹顶顶部的颜色 |
| sunDirection | [number, number, number] | [-0.78, 0.2, -0.6] | 太阳方向，内部会自动归一化 |
| glowColor | number | 0xff9947 | 太阳周围宽光晕的颜色 |
| sunColor | number | 0xffe0b8 | 日轮的颜色 |
| sunIntensity | number | 2.4 | 日轮的亮度系数 |
| sunSize | number | 10 | 日轮的角直径（单位：度）。日轮在屏幕空间绘制，因此无论太阳位于视野何处都保持正圆 |
| segments | number | 48 | 穹顶球体的水平分段数 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: SkyDomeOptions) | 创建穹顶。它继承自 `THREE.Mesh`，通过 `scene.add(sky)` 加入场景 |
| dispose | () => void | 销毁几何体与材质并从场景中移除。组件卸载时应调用以避免内存泄漏 |
