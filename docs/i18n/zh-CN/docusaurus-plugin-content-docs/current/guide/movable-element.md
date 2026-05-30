---
title: 动态元素
---

## 类型

类

import MovableElement from '@site/src/components/MovableElement'

## 默认用法

<MovableElement />

```tsx
import { Scene, Movable } from 'react-three-lite'
import { GLTFLoader } from 'react-three-lite'

function App() {
  const handleCreated = async (scene, { camera }) => {
    camera.position.set(0, 1.5, 3)

    // 使用GLTFLoader函数版本加载模型
    const model = await GLTFLoader('/models/perseverance.glb')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)

    // 创建可移动元素，起始位置为 [0, 0, -1]
    const element = new Movable(model, [0, 0, -1])

    // 在10秒内将模型移动到 [0, 0, 0]
    element.moveTo([0, 0, 0], 10000)
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    />
  )
}
```

## 属性

| 名称  | 类型        | 描述                 |
| ----- | ----------- | -------------------- |
| scene | THREE.Group | 要展示和移动的模型。 |

## 方法

| 名称        | 参数                                                               | 描述                                                              |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| constructor | (model: THREE.Group, position: [number, number, number]) => void | `model` 操作的模型；`position` 初始位置。                         |
| moveTo      | (position: [number, number, number], duration: number) => void   | `duration` 是从一个位置移动到另一个位置的持续时间，单位为毫秒。 |
