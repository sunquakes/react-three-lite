---
lang: en-US
title: Rain
---

## Type

Component

import RainComponent from '@site/src/components/effects/Rain'

## Default Usage

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
