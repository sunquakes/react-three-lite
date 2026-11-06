---
title: 雪效果
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SnowComponent from '@site/src/components/effects/Snow'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SnowComponent />

    ```tsx
    import { Scene, Snow } from 'react-three-lite'
    import * as THREE from 'three'

    export default function App() {
      const handleCreated = (scene: THREE.Scene) => {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -1.4
        scene.add(ground)
      }

      return (
        <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          <Snow
            count={2000}
            speed={0.5}
            color={0xffffff}
            range={16}
            height={14}
            accumulate
            accumulationThickness={0.12}
            accumulationDuration={6}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SnowComponent rendererType="webgl" />

    ```tsx
    import { Scene, Snow } from 'react-three-lite'
    import * as THREE from 'three'

    export default function App() {
      const handleCreated = (scene: THREE.Scene) => {
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 10),
          new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 1 })
        )
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -1.4
        scene.add(ground)
      }

      return (
        <Scene bgColor="rgb(40, 42, 54)" rendererType="webgl" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          <Snow
            count={2000}
            speed={0.5}
            color={0xffffff}
            range={16}
            height={14}
            accumulate
            accumulationThickness={0.12}
            accumulationDuration={6}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 积雪

设置 `accumulate` 后，雪会落在场景中朝上的表面上。每个可积雪的网格都会生成一层沿法线外扩的雪壳，从水平顶面开始逐渐覆盖到更陡的斜面，并在 `accumulationDuration` 秒后达到 `accumulationThickness` 的厚度 —— 积雪只增不减，到达上限后保持不变。

- 自动识别场景中的所有网格，包括之后才加载的模型和瓦片。
- 可通过 `accumulationTargets` 限定只在指定对象上积雪。
- 背面（天空盒）、透明、实例化和蒙皮网格会被跳过。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| count | number | 3000 | 雪花数量 |
| color | string \| number \| Color | 0xffffff | 雪花颜色 |
| speed | number | 0.5 | 下落速度倍率 |
| range | number | 20 | 水平分布范围 |
| height | number | 15 | 下落高度范围 |
| windX | number | 0.2 | X轴风力 |
| windZ | number | 0.1 | Z轴风力 |
| turbulence | number | 0.8 | 风场扰动强度，设为 0 时退化为均匀漂移 |
| opacity | number | 0.9 | 雪花不透明度 |
| size | number | 1 | 雪花大小倍率 |
| accumulate | boolean | false | 是否在场景网格上积雪 |
| accumulationTargets | Object3D \| Object3D[] | – | 积雪目标对象，省略时自动作用于所有可积雪网格 |
| accumulationThickness | number | 0.1 | 积雪最大厚度（世界单位） |
| accumulationDuration | number | 6 | 积雪达到最大厚度所需的秒数 |
| accumulationColor | string \| number \| Color | 0xffffff | 积雪颜色 |
