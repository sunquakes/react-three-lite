---
lang: zh-CN
title: 地面雷达脉冲
---

## 类型

类

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import RadarSweep from '@site/src/components/effects/RadarSweep'

地面探测雷达脉冲：当 `progress` 从 `0` 变化到 `1` 时，一圈环形色带从网格原点向外滚出，并被漂移噪声打散，所以波峰不会看起来像画出来的圆圈。每次脉冲都会绘制前沿、紧随其后较弱的第一次回波、已扫过地面的淡淡足迹，以及埋藏特征上的短促亮点。

传入 `heightAt` 采样器时，环带会被贴合到地形上，脉冲因此顺着起伏的地面滚动而不是切穿地面。请在加入场景**之前**设置网格位置（加入 `added` 事件时会重新采样），或在移动后调用 `rebuild()`。

传入 `period` 可让脉冲自行循环 —— 不需要动画循环。省略 `period` 时，可以每帧写入 `progress` 来手动驱动扫描。

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RadarSweep />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, RadarSweep } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function terrainHeight(x: number, z: number): number {
      return Math.sin(x * 0.55) * 0.22 + Math.cos(z * 0.4) * 0.18
    }

    export default function App() {
      const sweepRef = useRef<RadarSweep | null>(null)
      const groundRef = useRef<THREE.Mesh | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 7, 10)
        camera.lookAt(0, 0, 0)

        // 用与脉冲一致的采样器置换地面。
        const groundGeometry = new THREE.PlaneGeometry(22, 22, 96, 96)
        groundGeometry.rotateX(-Math.PI / 2)
        const positions = groundGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < positions.count; i += 1) {
          positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
        }
        groundGeometry.computeVertexNormals()

        const ground = new THREE.Mesh(
          groundGeometry,
          new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 1 })
        )
        scene.add(ground)
        groundRef.current = ground

        // `period` 让脉冲自行循环；不需要动画循环。
        const sweep = new RadarSweep({ radius: 8, heightAt: terrainHeight, period: 2.4 })
        scene.add(sweep)
        sweepRef.current = sweep
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          sweepRef.current?.dispose()
          sweepRef.current = null

          const ground = groundRef.current
          if (ground) {
            ground.parent?.remove(ground)
            ground.geometry.dispose()
            ;(ground.material as THREE.Material).dispose()
          }
          groundRef.current = null
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
    <RadarSweep rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, RadarSweep } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function terrainHeight(x: number, z: number): number {
      return Math.sin(x * 0.55) * 0.22 + Math.cos(z * 0.4) * 0.18
    }

    export default function App() {
      const sweepRef = useRef<RadarSweep | null>(null)
      const groundRef = useRef<THREE.Mesh | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 7, 10)
        camera.lookAt(0, 0, 0)

        // 用与脉冲一致的采样器置换地面。
        const groundGeometry = new THREE.PlaneGeometry(22, 22, 96, 96)
        groundGeometry.rotateX(-Math.PI / 2)
        const positions = groundGeometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < positions.count; i += 1) {
          positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
        }
        groundGeometry.computeVertexNormals()

        const ground = new THREE.Mesh(
          groundGeometry,
          new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 1 })
        )
        scene.add(ground)
        groundRef.current = ground

        // `period` 让脉冲自行循环；不需要动画循环。
        const sweep = new RadarSweep({ radius: 8, heightAt: terrainHeight, period: 2.4 })
        scene.add(sweep)
        sweepRef.current = sweep
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          sweepRef.current?.dispose()
          sweepRef.current = null

          const ground = groundRef.current
          if (ground) {
            ground.parent?.remove(ground)
            ground.geometry.dispose()
            ;(ground.material as THREE.Material).dispose()
          }
          groundRef.current = null
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
| radius | number | 8 | 脉冲向外扩展的外半径 |
| segments | number | 128 | 环带的径向分段数 |
| rings | number | 20 | 环带的同心分段数 |
| heightAt | (x: number, z: number) => number | — | 世界空间地面采样器。传入后环带会贴合到地形上 |
| color | number | 0x57ccff | 扫描色带的颜色 |
| crestColor | number | 0xa8f5ff | 波峰前沿的颜色 |
| echoDelay | number | 1.8 | 较弱的第一次回波落后波峰的距离 |
| opacity | number | 0.9 | 整个脉冲的透明度系数 |
| lift | number | 0.04 | 高于地形的高度偏移 |
| progress | number | 0 | 初始脉冲进度，取值 0-1 |
| period | number | — | 一次完整扫描的秒数。设置后脉冲会根据渲染计时器自行推进，无需每帧代码 |

## 属性

| 名称 | 类型 | 描述 |
|------|------|------|
| progress | number | 脉冲进度。`0` 从原点开始，`1` 到达外半径。设置 `period` 后，写入它会平移相位并从该处继续循环；未设置时，需要每帧写入来驱动扫描 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: RadarSweepOptions) | 创建脉冲。它继承自 `THREE.Mesh`，可设置位置并加入场景 |
| rebuild | () => void | 按当前世界位置重新采样 `heightAt`。加入场景（`added`）时自动调用 |
| dispose | () => void | 移除 `added` 监听，销毁几何体与材质并从场景中移除 |
