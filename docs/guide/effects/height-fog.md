---
lang: en-US
title: HeightFog
---

## Type

Component

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import HeightFog from '@site/src/components/effects/HeightFog'

## Default Usage

Screen-space height fog: an exponential fog layer whose density falls off with world height, with flowing noise on the fog plane and directional inscattering towards a light source. Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <HeightFog />

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
    <HeightFog rendererType="webgl" />

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

## Props

### Fog body

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| fogColor | string \| number \| Color | '#c9d4cc' | Fog color |
| fogDensity | number | 0.02 | Fog density at the fog plane |
| fogHeight | number | 10 | World height of the fog plane |
| fogHeightFalloff | number | 0.25 | Height falloff; density halves every 1/falloff units above the fog plane |
| fogMaxOpacity | number | 1 | Maximum fog opacity (caps how much the fog can cover the scene) |
| fogStartDistance | number | 0 | Distance from the camera where fog accumulation starts |

### Flowing noise

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| noiseStrength | number | 0 | How far noise displaces the fog plane vertically (0 disables noise) |
| noiseScale | number | 0.012 | Scale of the noise pattern in world units |
| noiseSpeedX | number | 0 | Noise flow speed along the X axis |
| noiseSpeedZ | number | 0 | Noise flow speed along the Z axis |

### Directional inscattering

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| inscatteringColor | string \| number \| Color | '#ffe2b0' | Color of the light inscattering |
| inscatteringIntensity | number | 1 | Inscattering intensity |
| inscatteringExponent | number | 5 | Sharpness of the directional falloff around the light direction |
| inscatteringStartDistance | number | 0 | Distance from the camera where inscattering starts |
| lightAzimuth | number | 30 | Light direction azimuth in degrees |
| lightElevation | number | 25 | Light direction elevation in degrees |
