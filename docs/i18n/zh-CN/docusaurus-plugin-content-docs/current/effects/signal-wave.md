---
lang: zh-CN
title: 信号波
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SignalWave from '@site/src/components/effects/SignalWave'

广播脉冲。一个面向相机的四边形在片元节点中绘制一道柔和的弧光；当 `life` 从 `0` 变化到 `1` 时放大网格缩放，每次脉冲都像一束向外扩散并逐渐消逝的信号。沿同一方位串联多个错开相位的波，就能形成一列行进的下行链路脉冲。

两种驱动方式：

- **自动** —— 传入 `travel` 后波形会沿 `bearing` 从 `origin` 自行动画：位置、缩放、朝向相机和 `life` 全部由波形自身的时钟驱动，不需要动画循环。`count` 会以子对象的形式添加错开相位的多个脉冲，一个对象即可渲染整列脉冲。
- **手动** —— 自行设置位置与缩放，用 `faceCamera()` 朝向相机，用 `setDirection()` 瞄准弧线，并每帧写入 `life`。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SignalWave />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, SignalWave } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const wavesRef = useRef<SignalWave | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 3.2, 11)
        camera.lookAt(0, 5, 0)

        // `travel` 让脉冲沿方位自行行进，`count` 把六个脉冲按相位错开；
        // 不需要动画循环。
        const waves = new SignalWave({
          bearing: [0.24, 1, 0],
          travel: 26,
          period: 26 / 7,
          count: 6,
          startScale: 0.45,
          endScale: 3.4
        })
        scene.add(waves)
        wavesRef.current = waves
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          wavesRef.current?.dispose()
          wavesRef.current = null
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
    <SignalWave rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import { Scene, SignalWave } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'
    import type * as THREE from 'three'

    export default function App() {
      const wavesRef = useRef<SignalWave | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 3.2, 11)
        camera.lookAt(0, 5, 0)

        // `travel` 让脉冲沿方位自行行进，`count` 把六个脉冲按相位错开；
        // 不需要动画循环。
        const waves = new SignalWave({
          bearing: [0.24, 1, 0],
          travel: 26,
          period: 26 / 7,
          count: 6,
          startScale: 0.45,
          endScale: 3.4
        })
        scene.add(waves)
        wavesRef.current = waves
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          wavesRef.current?.dispose()
          wavesRef.current = null
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
| innerColor | number | 0x2985ff | 弧光较暗处的颜色 |
| outerColor | number | 0xbdeaff | 弧光较亮处的颜色 |
| direction | [number, number] | [1, 0] | 弧线在四边形平面内朝向的方位（手动模式） |
| life | number | 0 | 初始生命周期，取值 0-1（手动模式） |
| bearing | [number, number, number] | [0, 1, 0] | 脉冲行进与弧线朝向的世界空间方位（自动模式） |
| origin | [number, number, number] | [0, 0, 0] | 行进的起点（世界空间，自动模式） |
| travel | number | — | 脉冲一个周期内行进的世界距离。设置后波形自行动画，无需每帧代码 |
| period | number | 2.4 | 自动模式下每个周期的秒数 |
| phase | number | 0 | 用于错开多个脉冲的相位偏移，取值 0-1（自动模式） |
| count | number | 1 | 以子对象形式创建的错相脉冲数量（自动模式） |
| startScale | number | 0.45 | 周期开始时的缩放（自动模式） |
| endScale | number | 3.4 | 周期结束时的缩放（自动模式） |

## 属性

| 名称 | 类型 | 描述 |
|------|------|------|
| life | number | 脉冲生命周期。`0` 在原点淡入，`1` 在终点淡出。自动模式下写入它会平移相位并从该处继续行进 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: SignalWaveOptions) | 创建脉冲。它继承自 `THREE.Mesh`，可设置位置与缩放并加入场景 |
| setDirection | (x: number, y: number) => void | 在四边形平面内瞄准弧线（手动模式） |
| faceCamera | (camera: THREE.Camera) => void | 让四边形朝向相机，弧线不会侧对镜头消失（手动模式） |
| dispose | () => void | 销毁几何体、材质与错相的子脉冲，并从场景中移除 |
