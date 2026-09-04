---
lang: zh-CN
title: 拾取
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Picking from '@site/src/components/Picking'

## 类型

组件（Scene 属性）/ 类（独立使用）

## 默认用法

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Picking />
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Picking rendererType="webgl" />
  </TabItem>
</Tabs>

```tsx
import { useRef } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents, PickEvent } from 'react-three-lite'
import * as THREE from 'three'

function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
  const hoveredRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return
    camera.position.set(0, 1, 6)
    camera.lookAt(0, 0, 0)

    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const material = new THREE.MeshStandardMaterial({ color: 0x4fc3f7 })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  }

  const handleClick = (event: PickEvent | null) => {
    if (!event) return
    const material = (event.object as THREE.Mesh).material as THREE.MeshStandardMaterial
    material.color.setHex(Math.random() * 0xffffff)
  }

  // onHover 仅在指针下的对象发生变化时触发，因此需要记录上一个悬停对象以便还原。
  const handleHover = (event: PickEvent | null) => {
    const previous = hoveredRef.current
    if (previous) {
      const material = previous.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x000000)
    }

    const mesh = event ? (event.object as THREE.Mesh) : null
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x444444)
    }
    hoveredRef.current = mesh
  }

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      onClick={handleClick}
      onHover={handleHover}
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
    />
  )
}
```

## Scene 属性

| 名称 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| onClick | `(event: PickEvent \| null) => void` | — | 点击事件（按下 + 抬起，且移动距离在阈值内） |
| onHover | `(event: PickEvent \| null) => void` | — | 悬停对象变化时触发，指针离开画布时传入 `null` |
| pickFilter | `(object: Object3D) => boolean` | — | 可选过滤函数，决定哪些对象可被拾取 |
| pickRecursive | `boolean` | `true` | 拾取时遍历场景子对象 |

## Picker 类

对于高级用法，可以直接导入 `Picker` 类：

```tsx
import { Picker } from 'react-three-lite'
import type { PickEvent, PickerOptions } from 'react-three-lite'
import * as THREE from 'three'

const picker = new Picker(scene, camera, renderer.domElement, {
  recursive: true,
  filter: (object) => object.name !== 'non-pickable',
  clickThreshold: 5,
})

picker.on('click', (event: PickEvent | null) => {
  if (event) console.log('clicked', event.object.name)
})

picker.on('hover', (event: PickEvent | null) => {
  if (event) console.log('hovered', event.object.name)
})

// 清理资源
picker.dispose()
```

## PickerOptions

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| targets | `Object3D[]` | — | 测试对象列表，默认为整个场景 |
| recursive | `boolean` | `true` | 遍历目标的后代 |
| filter | `(object: Object3D) => boolean` | — | 仅保留通过该谓词的相交结果 |
| enableHover | `boolean` | `true` | 在指针移动时触发悬停事件 |
| clickThreshold | `number` | `5` | 按下和抬起之间允许的最大指针移动距离（像素） |
| layers | `number \| number[]` | — | 拾取时使用的相机层，默认使用所有层 |
| near | `number` | — | 射线检测近平面 |
| far | `number` | — | 射线检测远平面 |

## PickEvent

| 属性 | 类型 | 描述 |
|------|------|------|
| object | `Object3D` | 被相交的对象 |
| point | `Vector3` | 世界空间中的相交点 |
| distance | `number` | 从相机到相交点的距离 |
| intersection | `Intersection` | 通过过滤的最接近的相交结果 |
| intersections | `Intersection[]` | 所有通过过滤的相交结果，按距离排序 |
| pointer | `Vector2` | 归一化设备坐标中的指针位置 |
| nativeEvent | `PointerEvent \| undefined` | 原始指针事件，程序化拾取时为 `undefined` |

## Picker 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | `(scene, camera, domElement, options?)` | 创建新的 Picker 实例 |
| on | `(type: 'click' \| 'hover', listener) => () => void` | 订阅事件，返回取消订阅函数 |
| off | `(type: 'click' \| 'hover', listener) => void` | 取消订阅事件 |
| pickAt | `(clientX: number, clientY: number) => PickEvent \| null` | 在指定客户端位置程序化拾取 |
| setTargets | `(targets?: Object3D[]) => void` | 替换测试对象列表 |
| setFilter | `(filter?: (object) => boolean) => void` | 替换相交过滤器 |
| setEnabled | `(enabled: boolean) => void` | 启用或禁用拾取器 |
| getHovered | `() => Object3D \| null` | 当前指针下的对象 |
| dispose | `() => void` | 移除事件监听并释放资源 |