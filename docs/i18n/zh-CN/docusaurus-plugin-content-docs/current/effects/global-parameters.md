---
lang: zh-CN
title: 全局参数总线
---

## 类型

类，并带有进程级的 `globalParameterBus` 实例。

## 用法

`SkyDome`、`Water`、`WaterPool` 与 `HeightFog` 共用同一个太阳。无需给每个组件传入 `sunDirection`，只需在全局参数总线上设置一次：

```tsx
import * as THREE from 'three'
import { Scene, SkyDome, Water, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

function App() {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    globalParameterBus.set('sunDirection', new THREE.Vector3(-0.58, 0.1, -0.81))

    const { camera } = components
    camera.position.set(0, 1.5, 3)

    scene.add(new SkyDome())
  }

  return (
    <Scene bgColor="rgb(40, 42, 54)" style={{ width: '100%', height: '300px' }} onCreated={handleCreated}>
      <Water />
    </Scene>
  )
}
```

`set` 会归一化向量并通知所有效果，因此日轮、水面、水池反射与雾效散射会立即更新，无需重新渲染 React 树。

运行时改变太阳方向也只需再次调用 `set`：

```tsx
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

## 参数

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| sunDirection | THREE.Vector3 | [-0.78, 0.2, -0.6]，已归一化 | 从场景指向太阳的世界空间方向 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| get | (key: keyof GlobalParameters) => GlobalParameters[K] | 返回当前值。请勿直接修改，使用 `set` |
| set | (key: keyof GlobalParameters, value: GlobalParameters[K]) => void | 归一化向量值、保存并通知订阅者 |
| subscribe | (key: keyof GlobalParameters, listener: (value, previous) => void) => () => void | 订阅某个参数，返回取消订阅函数 |
| reset | () => void | 将所有参数恢复为默认值并通知订阅者 |

## 使用方

- [渐变天空穹顶](/zh-CN/guide/effects/sky-dome) - 日轮位置
- [海洋水面](/zh-CN/guide/effects/water) - 太阳高光
- [互动水池](/zh-CN/guide/effects/water-pool) - 反射与折射光
- [高度雾](/zh-CN/guide/effects/height-fog) - 方向散射

## 说明

- 参数总线是进程级的，页面上的每个 `Scene` 都使用同一个太阳，按页面或应用设置一次即可。
- 效果在创建时读取当前值并持续订阅，因此可以随时改变太阳方向。
