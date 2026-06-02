---
sidebar_position: 1
---

# Rain 雨效果

`Rain` 组件使用粒子系统模拟降雨效果，适用于营造雨天氛围的场景。

## 基础用法

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

## 示例

import RainComponent from '@site/src/components/effects/Rain'

<RainComponent />

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| count | number | 4000 | 雨滴数量 |
| color | string \| number \| Color | 0xaaaaaa | 雨滴颜色 |
| speed | number | 1 | 下落速度倍率 |
| range | number | 20 | 水平分布范围 |
| height | number | 15 | 下落高度范围 |
| windX | number | 0.1 | X轴风力 |
| windZ | number | 0 | Z轴风力 |
| opacity | number | 0.8 | 雨滴不透明度 |
