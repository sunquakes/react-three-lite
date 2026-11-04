---
lang: zh-CN
title: 星云银河
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import NebulaGalaxy from '@site/src/components/effects/NebulaGalaxy'

用加色混合的公告板粒子绘制一片四条旋臂的银河。旋臂、星核与弥散星尘都由极坐标分布生成，再用一层程序化雾面把粒子图案揉开。拖动可以倾斜盘面，露出它薄薄的厚度；滚轮或双指缩放；点击时一道光波从星核出发，沿着旋臂向外扩散。远处的背景星不参与银河本体的旋转。

## 类型

类

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <NebulaGalaxy />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, NebulaGalaxy } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<NebulaGalaxy | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls, gridHelper } = components
        camera.position.set(0, 2.6, 11)
        camera.lookAt(0, 0, 0)

        // 银河自己处理指针交互
        controls.enabled = false
        if (gridHelper) gridHelper.visible = false

        const effect = new NebulaGalaxy()
        scene.add(effect)
        effectRef.current = effect
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          effectRef.current?.dispose()
          effectRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          onCreated={handleCreated}
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <NebulaGalaxy rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, NebulaGalaxy } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<NebulaGalaxy | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls, gridHelper } = components
        camera.position.set(0, 2.6, 11)
        camera.lookAt(0, 0, 0)

        // 银河自己处理指针交互
        controls.enabled = false
        if (gridHelper) gridHelper.visible = false

        const effect = new NebulaGalaxy()
        scene.add(effect)
        effectRef.current = effect
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          effectRef.current?.dispose()
          effectRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          onCreated={handleCreated}
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 交互

效果添加进场景后会自动接管画布上的交互，内部动画循环和事件监听都由组件自己管理，无需额外代码：

- **拖动** 倾斜盘面，范围受 `maxTiltX`、`maxTiltY` 限制，倾斜过程带平滑过渡而不会瞬间跳变。
- **滚轮** 或 **双指缩放** 在 `minZoom` 与 `maxZoom` 之间缩放盘面，避免镜头钻进星核。
- **点击** 或 **轻点** 时一道光波从星核出发。只有指针移动距离小于 6 px 才判定为点击，因此拖动不会误触发光波。
- 指针闲置时银河会缓慢自转（`autoRotate`）。当系统开启减少动态效果时，自动旋转与点击光波默认关闭。

也可以调用 `pulse()` 主动触发光波：

```tsx
const effect = new NebulaGalaxy()
scene.add(effect)

// 从星核出发的光波，可用于 HUD 按钮的点击反馈
effect.pulse()

// 切换到另一套配色、冻结自转或调整速度
effect.setPalette('aurora')
effect.setSpeed(0.5)
effect.setPaused(true)
```

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| arms | number | 4 | 旋臂数量 |
| armStars | number | 26000 | 勾出旋臂的星点数量 |
| coreStars | number | 4800 | 填充星核的粒子数量 |
| dustStars | number | 4400 | 用更大、更淡的光点揉开硬边的弥散星尘 |
| backgroundStars | number | 780 | 银河本体之外的远景背景星 |
| radius | number | 5.15 | 银河半径（世界单位） |
| armTightness | number | 1.12 | 旋臂随距离缠绕的紧密程度 |
| palette | 'violet-gold' \| 'aurora' \| 'warm-flame' | 'violet-gold' | 配色方案 |
| speed | number | 1 | 旋转速度倍数 |
| autoRotate | boolean | true | 指针闲置时是否缓慢自转。系统要求减少动态效果时默认为 `false` |
| interaction | boolean | true | 是否在画布上监听拖动 / 滚轮 / 双指事件 |
| pulse | boolean | true | 是否启用点击光波。系统要求减少动态效果时默认为 `false` |
| hazeOpacity | number | 0.95 | 程序化雾面的透明度 |
| followSpeed | number | 5.8 | 倾斜、缩放与配色过渡的平滑速度 |
| maxTiltX | number | 1.15 | 纵向最大倾斜角度（弧度） |
| maxTiltY | number | 1.25 | 横向最大倾斜角度（弧度） |
| minZoom | number | 0.62 | 最小缩放倍数 |
| maxZoom | number | 1.55 | 最大缩放倍数 |
| seed | number | 7 | 星点分布的确定性随机种子 |

## 成员

| 名称 | 类型 | 描述 |
|------|------|------|
| galaxy | THREE.Group | 银河中参与旋转的部分，指针倾斜与缩放作用于该分组 |
| stars | THREE.Mesh | 旋臂、星核与星尘粒子 |
| haze | THREE.Mesh | 程序化雾面 |
| ring | THREE.Mesh | 点击后向外扩散的环形光波 |
| background | THREE.Mesh | 不随银河旋转的远景星 |
| palette | GalaxyPalette | 当前正在过渡到的配色方案 |
| particleCount | number | 银河本体粒子数量 |
| backgroundCount | number | 远景背景星数量 |
| speed | number | 当前旋转速度倍数 |
| paused | boolean | 旋转是否已冻结 |
| time | number | 累计的着色器时间（秒） |
| pulseAge | number | 距上一次点击光波开始的时间（秒） |
| tilt | `{ x: number; y: number }` | 当前盘面倾斜角度（弧度） |
| zoom | number | 当前盘面缩放倍数 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: NebulaGalaxyOptions) | 创建效果。它继承自 `THREE.Group`，直接加入场景并通过 `position` 摆放 |
| setPalette | (palette: GalaxyPalette) => void | 将星核、旋臂与边缘颜色平滑过渡到另一套内置配色 |
| setSpeed | (speed: number) => void | 设置旋转速度倍数，0 会让着色器时间停住 |
| setPaused | (paused: boolean) => void | 冻结或恢复旋转与闲置自转 |
| setAutoRotate | (enabled: boolean) => void | 开启或关闭指针闲置时的自转 |
| pulse | () => void | 从星核出发沿旋臂送出一道点击光波 |
| update | (deltaSeconds: number) => void | 手动推进效果，内部动画循环每帧调用 |
| dispose | () => void | 停止动画、移除画布监听、释放几何体与材质并从场景中移除。组件卸载时应调用以避免内存泄漏 |
