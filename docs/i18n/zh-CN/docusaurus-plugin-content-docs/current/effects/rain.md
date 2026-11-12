---
title: 雨效果
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import RainComponent from '@site/src/components/effects/Rain'
import RainCollision from '@site/src/components/effects/RainCollision'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RainComponent />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <RainComponent rendererType="webgl" />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="rgb(40, 42, 54)" rendererType="webgl" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 碰撞与落点水花

传入灰度 `heightMap` 后，雨滴不再穿透地面，而是落在地形表面；每个落点会生成一个扩散的水花圆圈。高度图覆盖以原点为中心、边长为 `heightMapSize` 的世界区域，采样方式与平面的 UV 一致（`u = x / size + 0.5`、`v = 0.5 - z / size`），因此用同一张图位移出来的地形与落点完全对齐。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RainCollision />

    ```tsx
    import { useState } from 'react'
    import * as THREE from 'three'
    import { Rain, Scene } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    const SIZE = 40
    const HEIGHT = 24
    const GROUND_Y = -HEIGHT / 2
    const AMPLITUDE = HEIGHT * 0.4

    export default function App() {
      const [heightMap, setHeightMap] = useState<THREE.CanvasTexture | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        camera.position.set(0, 8, 27)
        controls.target.set(0, -3, 0)
        controls.update()

        // 任意灰度图都可以；这里直接生成，避免依赖外部资源。
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = 128
        const ctx = canvas.getContext('2d')!
        const image = ctx.createImageData(128, 128)
        for (let y = 0; y < 128; y++) {
          for (let x = 0; x < 128; x++) {
            const value = (Math.sin(x / 11) * Math.cos(y / 13) * 0.5 + 0.5) * 255
            const i = (y * 128 + x) * 4
            image.data[i] = image.data[i + 1] = image.data[i + 2] = value
            image.data[i + 3] = 255
          }
        }
        ctx.putImageData(image, 0, 0)

        const texture = new THREE.CanvasTexture(canvas)
        texture.generateMipmaps = false
        texture.minFilter = THREE.LinearFilter
        setHeightMap(texture)

        // 用同一张图位移地形，让雨滴落在可见的表面上。
        const geometry = new THREE.PlaneGeometry(SIZE, SIZE, 128, 128)
        geometry.rotateX(-Math.PI / 2)
        const position = geometry.attributes.position
        const uv = geometry.attributes.uv
        for (let i = 0; i < position.count; i++) {
          const col = Math.round(uv.getX(i) * 127)
          const row = Math.round((1 - uv.getY(i)) * 127)
          position.setY(i, GROUND_Y + (image.data[(row * 128 + col) * 4] / 255) * AMPLITUDE)
        }
        position.needsUpdate = true
        geometry.computeVertexNormals()
        scene.add(
          new THREE.Mesh(
            geometry,
            new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 0.85 })
          )
        )
      }

      return (
        <Scene bgColor="rgb(28, 30, 40)" axesHelper={false} gridHelper={false} style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
          {heightMap && (
            <Rain
              count={5000}
              range={SIZE}
              height={HEIGHT}
              heightMap={heightMap}
              heightMapSize={SIZE}
              heightMapAmplitude={AMPLITUDE}
              groundHeight={GROUND_Y}
              splashSize={1}
              splashDuration={0.7}
            />
          )}
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <RainCollision rendererType="webgl" />

    ```tsx
    // 同一个组件，改用经典 WebGL 渲染器：
    <Scene bgColor="rgb(28, 30, 40)" rendererType="webgl" axesHelper={false} gridHelper={false} onCreated={handleCreated}>
      {heightMap && <Rain heightMap={heightMap} splashSize={1} splashDuration={0.7} />}
    </Scene>
    ```
  </TabItem>
</Tabs>

设置 `splash={false}` 可以保留碰撞但不显示水花；通过 `splashColor`、`splashSize`、`splashDuration` 调整水花效果。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| count | number | 4000 | 雨滴数量 |
| color | string \| number \| Color | 0xb0c4de | 雨滴颜色 |
| speed | number | 1 | 下落速度倍率 |
| range | number | 20 | 水平分布范围 |
| height | number | 15 | 下落高度范围 |
| windX | number | 0.1 | X轴风力 |
| windZ | number | 0 | Z轴风力 |
| opacity | number | 0.8 | 雨滴不透明度 |
| heightMap | string \| Texture | - | 雨滴碰撞的灰度高度图 |
| heightMapSize | number | range | 高度图覆盖的世界范围 |
| heightMapAmplitude | number | height * 0.4 | 高度图叠加的垂直高度 |
| groundHeight | number | -height / 2 | 高度图基准地面 Y |
| splash | boolean | true | 落点是否绘制扩散水花 |
| splashColor | string \| number \| Color | 0xd6ecff | 水花颜色 |
| splashSize | number | 0.9 | 水花最大世界半径 |
| splashDuration | number | 0.6 | 水花持续时间（秒） |
