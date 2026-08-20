---
lang: zh-CN
title: 模型旋转器
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import ModelRotator from '@site/src/components/ModelRotator'

## 类型

类

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <ModelRotator />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, ModelRotator, GLTFLoaderAsync } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function App() {
      const rotatorRef = useRef<ModelRotator | null>(null)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 0, 4)
        camera.lookAt(0, 0, 0)

        const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
        model.position.set(0, 0, 0)
        scene.add(model)

        rotatorRef.current = new ModelRotator(model, {
          axis: 'y',
          speed: 0.5,
          autoStart: true,
        })
      }

      useEffect(() => {
        return () => {
          rotatorRef.current?.dispose()
          rotatorRef.current = null
        }
      }, [])

      return (
        <Scene bgColor="#1a1a2e" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <ModelRotator rendererType="webgl" />

    ```tsx
    import { useRef, useEffect } from 'react'
    import * as THREE from 'three'
    import { Scene, ModelRotator, GLTFLoaderAsync } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    function App() {
      const rotatorRef = useRef<ModelRotator | null>(null)

      const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 0, 4)
        camera.lookAt(0, 0, 0)

        const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
        model.position.set(0, 0, 0)
        scene.add(model)

        rotatorRef.current = new ModelRotator(model, {
          axis: 'y',
          speed: 0.5,
          autoStart: true,
        })
      }

      useEffect(() => {
        return () => {
          rotatorRef.current?.dispose()
          rotatorRef.current = null
        }
      }, [])

      return (
        <Scene rendererType="webgl" bgColor="#1a1a2e" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
      )
    }
    ```
  </TabItem>
</Tabs>

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| axis | 'x' \| 'y' \| 'z' | 'y' | 旋转轴 |
| speed | number | 0.5 | 旋转速度（弧度/秒） |
| autoStart | boolean | true | 创建时自动开始旋转 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (target: THREE.Object3D, options?: ModelRotatorOptions) | 创建模型旋转器，用于360度展示模型 |
| play | () => void | 开始或继续旋转 |
| pause | () => void | 暂停旋转 |
| stop | () => void | 停止旋转并重置到初始状态 |
| setSpeed | (speed: number) => void | 设置旋转速度 |
| setAxis | (axis: 'x' \| 'y' \| 'z') => void | 设置旋转轴 |
| dispose | () => void | 销毁旋转器并释放资源 |
