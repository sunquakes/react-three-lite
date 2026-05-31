---
title: 弹窗
---

## 类型

类

import PopupComponent from '@site/src/components/Popup'

## 默认用法

<PopupComponent />

```tsx
import { Scene, Popup } from 'react-three-lite'
import TrafficLight from './TrafficLight'

function App() {
  const handleCreated = (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)

    // 在起始位置 [0, 1, 0] 创建包含React组件的popup
    const popup = new Popup([0, 1, 0], <TrafficLight />, {})
    scene.add(popup.scene)

    // 垂直向上移动到 [0, 2, 0]，动画持续2秒
    popup.moveTo([0, 2, 0], 2000)
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

#### `TrafficLight.tsx`

```tsx
import { useState, useEffect } from 'react'

export default function TrafficLight() {
  const [currentLight, setCurrentLight] = useState('red')
  const [offsetY, setOffsetY] = useState(0)

  useEffect(() => {
    // 灯光颜色变化动画
    const lightTimer = setInterval(() => {
      setCurrentLight(prev => {
        if (prev === 'red') return 'green'
        if (prev === 'green') return 'yellow'
        return 'red'
      })
    }, 2000)

    // 垂直移动动画
    let direction = 1
    const moveTimer = setInterval(() => {
      setOffsetY(prev => {
        const newValue = prev + direction * 0.05
        if (newValue > 0.3 || newValue < -0.3) {
          direction = -direction
        }
        return Math.max(-0.3, Math.min(0.3, newValue))
      })
    }, 50)

    return () => {
      clearInterval(lightTimer)
      clearInterval(moveTimer)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '8px',
      background: '#333',
      borderRadius: '6px',
      border: '1px solid #666',
      transform: `translateY(${offsetY}px)`
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'red' ? '#ff0000' : '#330000',
        boxShadow: currentLight === 'red' ? '0 0 10px #ff0000' : 'none',
        transition: 'all 0.3s'
      }} />
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'yellow' ? '#ffff00' : '#333300',
        boxShadow: currentLight === 'yellow' ? '0 0 10px #ffff00' : 'none',
        transition: 'all 0.3s'
      }} />
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: currentLight === 'green' ? '#00ff00' : '#003300',
        boxShadow: currentLight === 'green' ? '0 0 10px #00ff00' : 'none',
        transition: 'all 0.3s'
      }} />
    </div>
  )
}
```

## 方法

| 名称        | 参数                                                                              | 描述                                                         |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| constructor | (position: [number, number, number], component: ReactNode, props: object) => void | 创建一个新的 Popup 实例。`component` 可以是一个 React 元素。   |
| moveTo      | (position: [number, number, number], duration: number) => void                    | `duration` 是从一个位置移动到另一个位置的持续时间，单位为毫秒。 |
