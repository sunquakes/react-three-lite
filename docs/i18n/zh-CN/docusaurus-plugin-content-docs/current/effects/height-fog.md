---
title: 高度雾
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import HeightFogComponent from '@site/src/components/effects/HeightFog'

## 默认用法

屏幕空间高度雾：密度随世界高度指数衰减的雾层，支持雾面流动噪声与朝向光源的方向散射。下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <HeightFogComponent />

    ```tsx
    import { Scene, HeightFog } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="#1a1a2e" style={{ width: '100%', height: '300px' }}>
          <HeightFog />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <HeightFogComponent rendererType="webgl" />

    ```tsx
    import { Scene, HeightFog } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="#1a1a2e" rendererType="webgl" style={{ width: '100%', height: '300px' }}>
          <HeightFog />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 属性

### 雾体

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fogColor | string \| number \| Color | '#c9d4cc' | 雾颜色 |
| fogDensity | number | 0.02 | 雾面处的雾密度 |
| fogHeight | number | 10 | 雾面的世界高度 |
| fogHeightFalloff | number | 0.25 | 高度衰减系数；雾面之上每升高 1/falloff 个单位密度减半 |
| fogMaxOpacity | number | 1 | 雾的最大不透明度（限制雾对场景的遮盖程度） |
| fogStartDistance | number | 0 | 雾从距离相机多远开始累积 |

### 流动噪声

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| noiseStrength | number | 0 | 噪声对雾面的垂直扰动幅度（0 表示关闭噪声） |
| noiseScale | number | 0.012 | 噪声图案的世界空间缩放 |
| noiseSpeedX | number | 0 | 噪声沿 X 轴的流动速度 |
| noiseSpeedZ | number | 0 | 噪声沿 Z 轴的流动速度 |

### 方向散射

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| inscatteringColor | string \| number \| Color | '#ffe2b0' | 散射光颜色 |
| inscatteringIntensity | number | 1 | 散射强度 |
| inscatteringExponent | number | 5 | 方向衰减指数，值越大散射越集中在光源方向 |
| inscatteringStartDistance | number | 0 | 散射从距离相机多远开始 |
| lightAzimuth | number | 30 | 光源方向方位角（度） |
| lightElevation | number | 25 | 光源方向仰角（度） |
