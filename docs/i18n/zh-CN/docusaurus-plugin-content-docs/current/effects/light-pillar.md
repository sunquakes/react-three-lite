---
lang: zh-CN
title: 光柱效果
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import LightPillarComponent from '@site/src/components/effects/LightPillar'

由半透明外锥、更亮的内层光芯、顶部呼吸光晕以及两圈地面扩散脉冲环组成的锥形光柱。常用作数据标记：把归一化后的数值映射到 `height` 配置项，柱体越高代表数值越大。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <LightPillarComponent />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, LightPillar } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const pillarsRef = useRef<LightPillar[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 2.4, 6)
        camera.lookAt(0, 1, 0)

        const data = [
          { x: -2.2, z: 0, value: 0.35, color: 0x00ffff },
          { x: 0, z: -0.6, value: 1, color: 0x36e0a0 },
          { x: 2.2, z: 0, value: 0.62, color: 0xffb347 }
        ]

        data.forEach(({ x, z, value, color }) => {
          const pillar = new LightPillar({
            color,
            height: 1 + value * 2.4,
            radius: 0.22
          })
          pillar.position.set(x, 0, z)
          scene.add(pillar)
          pillarsRef.current.push(pillar)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          pillarsRef.current.forEach((pillar) => pillar.dispose())
          pillarsRef.current = []
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
    <LightPillarComponent rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, LightPillar } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const pillarsRef = useRef<LightPillar[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 2.4, 6)
        camera.lookAt(0, 1, 0)

        const data = [
          { x: -2.2, z: 0, value: 0.35, color: 0x00ffff },
          { x: 0, z: -0.6, value: 1, color: 0x36e0a0 },
          { x: 2.2, z: 0, value: 0.62, color: 0xffb347 }
        ]

        data.forEach(({ x, z, value, color }) => {
          const pillar = new LightPillar({
            color,
            height: 1 + value * 2.4,
            radius: 0.22
          })
          pillar.position.set(x, 0, z)
          scene.add(pillar)
          pillarsRef.current.push(pillar)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          pillarsRef.current.forEach((pillar) => pillar.dispose())
          pillarsRef.current = []
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
| color | number | 0x00ffff | 光柱颜色，默认青色 |
| height | number | 3 | 光柱沿 Y 轴的高度，底面位于 `y = 0` |
| radius | number | 0.3 | 锥体底面半径 |
| opacity | number | 1 | 全局不透明度系数（0-1） |
| speed | number | 1 | 动画速度系数 |
| segments | number | 32 | 锥体与圆环的径向分段数 |
| glow | boolean | true | 是否渲染顶部呼吸光晕 |
| ring | boolean | true | 是否渲染底部的两圈扩散脉冲环 |
| ringRadius | number | radius * 3 | 脉冲环扩散到的外半径 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: LightPillarOptions) | 创建光柱。它继承自 `THREE.Group`，直接加入场景并通过 `position` 摆放 |
| dispose | () => void | 销毁光柱、停止动画并从场景中移除。组件卸载时应调用以避免内存泄漏 |
