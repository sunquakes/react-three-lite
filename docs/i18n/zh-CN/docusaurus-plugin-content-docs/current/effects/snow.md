---
title: 雪效果
---

## 类型

组件

import SnowComponent from '@site/src/components/effects/Snow'

## 默认用法

<SnowComponent />

```tsx
import { Scene, Snow } from 'react-three-lite'

export default function App() {
  return (
    <Scene bgColor="#1e293b" style={{ width: '100%', height: '300px' }}>
      <Snow count={2000} speed={0.5} color={0xffffff} range={25} height={18} />
    </Scene>
  )
}
```

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
| opacity | number | 0.9 | 雪花不透明度 |
| size | number | 1 | 雪花大小倍率 |
