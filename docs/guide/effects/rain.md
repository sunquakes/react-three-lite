---
sidebar_position: 1
---

# Rain

The `Rain` component simulates a rainfall effect using a particle system, suitable for creating atmospheric rainy scenes.

## Basic Usage

```tsx
import { Scene, Rain } from 'react-three-lite'

export default function App() {
  return (
    <Scene bgColor="#1a1a2e" style={{ width: '100%', height: '300px' }}>
      <Rain count={3000} speed={0.8} color={0xaaaaee} range={30} height={20} />
    </Scene>
  )
}
```

## Example

import RainComponent from '@site/src/components/effects/Rain'

<RainComponent />

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| count | number | 4000 | Number of raindrops |
| color | string \| number \| Color | 0xaaaaaa | Raindrop color |
| speed | number | 1 | Falling speed multiplier |
| range | number | 20 | Horizontal distribution range |
| height | number | 15 | Falling height range |
| windX | number | 0.1 | Wind force on X axis |
| windZ | number | 0 | Wind force on Z axis |
| opacity | number | 0.8 | Raindrop opacity |
