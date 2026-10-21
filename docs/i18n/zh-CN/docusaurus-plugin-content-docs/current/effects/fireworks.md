---
lang: zh-CN
title: 烟花效果
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Fireworks from '@site/src/components/effects/Fireworks'

完全由着色器实现的烟花弹。一条发射拖尾从原点升起，随后炸裂成球状喷洒的、受重力弯曲的丝带轨迹：头部发光，尾部通过数值噪声溶解消散。一个 `Fireworks` 实例就是一发烟花 —— 添加多个不同颜色、高度与相位的实例即可编排一整场表演。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Fireworks />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, Fireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const fireworksRef = useRef<Fireworks[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 6, 17)
        camera.lookAt(0, 6, 0)

        const shells = [
          { color: 0xffd4a0, height: 6.6, scale: 3.6, offset: [-3.6, 0, -1.5], launchDuration: 1.25, burstDuration: 1.9 },
          { color: 0x7ad7ff, height: 5.9, scale: 3.9, offset: [-1.4, 0, 1.6], launchDuration: 1.7, burstDuration: 1.6 },
          { color: 0xff6b6b, height: 7.4, scale: 3.2, offset: [3.2, 0, -0.8], launchDuration: 1.5, burstDuration: 2.2 }
        ]

        shells.forEach((shell) => {
          const fireworks = new Fireworks({
            color: shell.color,
            burstHeight: shell.height,
            burstScale: shell.scale,
            burstPositionOffset: new THREE.Vector3(...shell.offset),
            launchDuration: shell.launchDuration,
            burstDuration: shell.burstDuration,
            loop: true
          })
          scene.add(fireworks)
          fireworksRef.current.push(fireworks)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          fireworksRef.current.forEach((fireworks) => fireworks.dispose())
          fireworksRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="#1a1a2e"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Fireworks rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, Fireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const fireworksRef = useRef<Fireworks[]>([])

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 6, 17)
        camera.lookAt(0, 6, 0)

        const shells = [
          { color: 0xffd4a0, height: 6.6, scale: 3.6, offset: [-3.6, 0, -1.5], launchDuration: 1.25, burstDuration: 1.9 },
          { color: 0x7ad7ff, height: 5.9, scale: 3.9, offset: [-1.4, 0, 1.6], launchDuration: 1.7, burstDuration: 1.6 },
          { color: 0xff6b6b, height: 7.4, scale: 3.2, offset: [3.2, 0, -0.8], launchDuration: 1.5, burstDuration: 2.2 }
        ]

        shells.forEach((shell) => {
          const fireworks = new Fireworks({
            color: shell.color,
            burstHeight: shell.height,
            burstScale: shell.scale,
            burstPositionOffset: new THREE.Vector3(...shell.offset),
            launchDuration: shell.launchDuration,
            burstDuration: shell.burstDuration,
            loop: true
          })
          scene.add(fireworks)
          fireworksRef.current.push(fireworks)
        })
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          fireworksRef.current.forEach((fireworks) => fireworks.dispose())
          fireworksRef.current = []
        }
      }, [])

      return (
        <Scene
          bgColor="#1a1a2e"
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
| radius | number | 1 | 炸裂拖尾的目标长度半径，烘焙进几何体 |
| detail | number | 0 | 二十面体细分级别，烘焙进几何体 |
| segments | number | 5 | 每条拖尾上采样的分段数，烘焙进几何体 |
| gravity | number | 1 | 使拖尾向下弯曲的重力抛物线系数，烘焙进几何体 |
| width | number | 0.1 | 丝带半宽 |
| startTime | number | 0 | 动画起始时间（秒） |
| launchDuration | number | 1.5 | 发射阶段时长（秒） |
| delayDuration | number | -0.4 | 发射与炸裂之间的延迟，可为负值以重叠 |
| burstDuration | number | 2 | 炸裂阶段时长（秒） |
| burstHeight | number | 6.5 | 沿局部 Y 轴的炸裂高度 |
| burstScale | number | 3.5 | 整体炸裂缩放 |
| burstPositionOffset | THREE.Vector3 | (0, 0, 0) | 炸裂原点偏移 |
| loop | boolean | true | 一个周期结束后是否重新播放 |
| color | THREE.ColorRepresentation | '#ffd4a0' | 丝带基础颜色 |
| bloomIntensity | number | 9 | 头部光晕强度 |
| bloomFalloff | number | 18 | 头部光晕长度指数，越大头部越收窄 |
| noiseFalloff | number | 3 | 噪声溶解的时间指数 |
| noiseScale | THREE.Vector2 | (10, 200) | 噪声 UV 缩放（横向、纵向） |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: FireworksOptions) | 创建一发烟花。它继承自 `THREE.Mesh`，直接加入场景并通过 `position` 摆放 |
| update | (deltaSeconds: number) => void | 按秒推进动画时间 |
| restart | () => void | 将当前时间重置为 0，并从 `startTime` 重新播放 |
| dispose | () => void | 销毁烟花、停止动画并从场景中移除。组件卸载时应调用以避免内存泄漏 |
