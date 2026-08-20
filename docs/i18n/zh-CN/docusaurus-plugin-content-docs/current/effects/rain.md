---
title: 雨效果
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import RainComponent from '@site/src/components/effects/Rain'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <RainComponent />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="#0f172a" style={{ width: '100%', height: '300px' }}>
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
        <Scene bgColor="#0f172a" rendererType="webgl" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

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
