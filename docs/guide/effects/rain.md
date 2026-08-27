---
lang: en-US
title: Rain
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Rain from '@site/src/components/effects/Rain'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Rain />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="#1a1a2e" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Rain rendererType="webgl" />

    ```tsx
    import { Scene, Rain } from 'react-three-lite'

    export default function App() {
      return (
        <Scene bgColor="#1a1a2e" rendererType="webgl" style={{ width: '100%', height: '300px' }}>
          <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| count | number | 4000 | Number of raindrops |
| color | string \| number \| Color | 0xb0c4de | Raindrop color |
| speed | number | 1 | Falling speed multiplier |
| range | number | 20 | Horizontal distribution range |
| height | number | 15 | Falling height range |
| windX | number | 0.1 | Wind force on X axis |
| windZ | number | 0 | Wind force on Z axis |
| opacity | number | 0.8 | Raindrop opacity |
