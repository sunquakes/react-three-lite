---
lang: zh-CN
title: 引线注释
---

import Callout from '@site/src/components/Callout'

## 类型

类

## 默认用法

<Callout />

```tsx
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Scene, Callout } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App() {
  const calloutRef = useRef<Callout | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    // 原点处的正方体，注释指向它
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    scene.add(box)

    // Callout：start（锚点）在正方体表面，end（标签）在右侧。
    // autoAnchor 让标签底边的连接点跟随相机——每帧调用 updateLabelAnchor(camera)。
    const callout = new Callout(
      [0.5, 0.5, 0.5],                     // start（锚点）— 正方体角点
      [1.5, 1.0, 0.5],                     // end（标签）— 正方体右侧
      <div style={{
        padding: '8px 14px',
        background: 'linear-gradient(180deg, #ff8a2b 0%, #e66400 100%)',
        borderRadius: '4px',
        color: '#1a0f00',
        fontSize: '16px',
        fontWeight: 600
      }}>This is a box!</div>,
      {
        color: '#ffffff',
        lineWidth: 2,
        lineShape: 'broken',               // 'straight' 直线 | 'broken' 折线（钝角拐点）
        bendAxis: 'x',                     // 'auto' 自动 | 'x' | 'y' | 'z'  — 与标签平行段的轴
        bendRatio: 2 / 3,                  // 斜线水平投影 = 总水平距离的 1/3
        autoAnchor: true,                  // 连接点按方向在底边上自动滑动
        showDot: true,
        dotColor: '#ffffff',
        dotRadius: 0.06
      }
    )
    scene.add(callout.scene)
    callout.attach(camera)                  // 启动内部 autoAnchor 循环
    calloutRef.current = callout
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      calloutRef.current?.dispose()
      calloutRef.current = null
    }
  }, [])

  return (
    <Scene
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', width: '100%', height: '360px' }}
      onCreated={handleCreated}
    />
  )
}
```

## 配置项

| 属性         | 类型                           | 默认值        | 描述                                                                |
| ------------ | ------------------------------ | ------------- | ------------------------------------------------------------------- |
| color        | number \| string               | 0xffffff      | 线条（及默认锚点）颜色。支持十六进制数字或 CSS 颜色字符串。            |
| lineWidth    | number                         | 1             | 线宽（仅在 WebGL2 环境下生效）。                                      |
| lineShape    | `'straight' \| 'broken'`       | `'broken'`    | 引线形状：`straight` 直线，`broken` 带拐点的 L 形折线。               |
| bendAxis     | `'auto' \| 'x' \| 'y' \| 'z'`  | `'auto'`      | （折线生效）与标签平行的段使用的轴；`auto` 自动选择差值最大的轴。       |
| bendRatio    | number                         | 0.45          | （折线生效）拐点在 bendAxis 上距离标签往锚点方向的比例 (0–1)。取值 (0,1) 之间严格保证**钝角**（0→平角180°，1→直角90°）。 |
| labelAnchor  | LabelAnchor                    | 'bottom-left' | ReactNode 标签的哪个角/点对齐到 `end` 坐标。可选 `'center'` \| `'top-left'` \| `'top-right'` \| `'bottom-left'` \| `'bottom-right'`。`autoAnchor` 为 true 时忽略。 |
| autoAnchor   | boolean                        | false         | 为 true 时，连接点根据相机每帧计算的**屏幕水平方向** `end`→`start`，在标签**底边**上滑动：start 在屏幕左侧→左下角，右侧→右下角，接近正上/正下→底边中点。使用 `smoothstep` + 阈值映射，只要水平方向有明确偏移就完全到达两端角。通过 `attach(camera)` 启动内部 rAF 循环。覆盖 `labelAnchor`。 |
| dashed       | boolean                        | false         | 是否使用虚线。为 true 时 `dashSize` 和 `gapSize` 生效。               |
| dashSize     | number                         | 0.1           | 虚线线段长度。                                                       |
| gapSize      | number                         | 0.05          | 虚线间隔长度。                                                       |
| showDot      | boolean                        | true          | 是否在起点显示锚点圆点。                                              |
| dotColor     | number \| string               | 同 color      | 锚点圆点颜色。                                                        |
| dotRadius    | number                         | 0.05          | 锚点圆点半径。                                                        |
| showLabel    | boolean                        | true          | 是否在终点显示 React 渲染的标签。                                     |

## 方法

| 名称         | 参数                                                                                  | 描述                                                                                     |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| constructor  | <code>(start: Position, end: Position, component: ReactNode, options?: CalloutOptions) => void</code> | 创建引线注释。`start` 锚点位置，`end` 标签位置，`component` 标签内容。                    |
| moveTo       | <code>(end: Position, duration: number) => void</code>                                | 将标签（终点）动画移动到新位置，同步更新折线拐点。`duration` 单位毫秒。                   |
| setStart     | <code>(start: Position) => void</code>                                                | 立即更新锚点（起点），自动重算折线拐点。                                                   |
| setEnd       | <code>(end: Position) => void</code>                                                  | 立即更新标签（终点），自动重算折线拐点。                                                   |
| setLineShape | <code>(shape: LineShape, opts?: &#123; bendAxis?: BendAxis; bendRatio?: number &#125;) => void</code> | 运行时切换线形状，并可重新配置折线参数。                                                  |
| attach       | <code>(camera: THREE.Camera) => void</code>                                          | 绑定相机并启动内部 rAF 循环，`autoAnchor` 为 true 时让标签连接点跟随相机。添加到场景后调用一次。 |
| detach       | <code>() => void</code>                                                              | 停止内部 autoAnchor rAF 循环。可多次调用。                                              |
| dispose      | <code>() => void</code>                                                               | 销毁引线注释并释放所有资源（几何体、材质、标签 React root、DOM 节点、rAF 循环）。              |
