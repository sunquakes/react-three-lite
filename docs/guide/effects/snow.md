---
sidebar_position: 2
---

# Snow

The `Snow` component simulates a snowfall effect using a particle system, suitable for creating atmospheric winter scenes.

## Basic Usage

```tsx
import { Scene, Snow } from 'react-three-lite'

export default function App() {
  return (
    <Scene bgColor="#1a1a2e" style={{ width: '100%', height: '300px' }}>
      <Snow count={2000} speed={0.5} color={0xffffff} range={25} height={18} />
    </Scene>
  )
}
```

## Example

import SnowComponent from '@site/src/components/effects/Snow'

<SnowComponent />

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| count | number | 3000 | Number of snowflakes |
| color | string \| number \| Color | 0xffffff | Snowflake color |
| speed | number | 0.5 | Falling speed multiplier |
| range | number | 20 | Horizontal distribution range |
| height | number | 15 | Falling height range |
| windX | number | 0.2 | Wind force on X axis |
| windZ | number | 0.1 | Wind force on Z axis |
| opacity | number | 0.9 | Snowflake opacity |
| size | number | 1 | Snowflake size multiplier |
