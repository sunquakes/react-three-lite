---
lang: zh-CN
title: 文字烟花
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import TextFireworks from '@site/src/components/effects/TextFireworks'

将一句话绘制到离屏 Canvas 上并采样成粒子，每个被采样的像素都会变成一个发光点。播放时字形炸开，按从左到右的顺序分成不同颜色的组，飞向四个错落的烟花中心，随后再飘回各自原本所在的像素，重新拼回可阅读的文字。第二层更暗、略微延迟的粒子作为拖尾。

## 类型

类

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <TextFireworks />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, TextFireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<TextFireworks | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1, 6)
        camera.lookAt(0, 1, 0)

        const effect = new TextFireworks({ text: 'Good things are coming' })
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
    <TextFireworks rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, TextFireworks } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const effectRef = useRef<TextFireworks | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        camera.position.set(0, 1, 6)
        camera.lookAt(0, 1, 0)

        const effect = new TextFireworks({ text: 'Good things are coming' })
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

## 自定义文字

调用 `setText()` 采样新的句子，再调用 `launch()` 重新播放整个周期。上方示例中的输入框就是这样实现的。

```tsx
const effect = new TextFireworks({ text: 'Good things are coming' })
scene.add(effect)

// 采样新文字并让粒子停在新字形上
effect.setText('Hello, world')

// 重新播放升空、炸开与回落
effect.launch()
```

效果加入场景 1.2 秒后会自动播放一次。如果想自己触发，可以传入 `autoPlay: false`。

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| text | string | 'Good things are coming' | 采样成粒子的文字 |
| colors | THREE.ColorRepresentation[] | 橙、金、蓝、紫 | 每个横向分组的炸开颜色，从左到右 |
| burstCenters | Array\<[number, number]\> | 四个错落的位置 | 每个分组的炸开中心（世界单位） |
| burstScale | number | 1 | 作用于炸开中心与径向扩散的统一缩放 |
| groupDelay | number | 0.22 | 相邻分组升空的间隔（秒） |
| groupJitter | number | 0.2 | 单个粒子的额外延迟抖动（秒） |
| pointSize | number | 3.4 | 粒子大小（CSS 像素） |
| trailOffset | number | 0.105 | 拖尾层落后主层的时间（秒） |
| trailOpacity | number | 0.34 | 拖尾层的透明度倍数 |
| restColor | THREE.ColorRepresentation | 0xffd4ad | 文字静止时以及回落后的颜色 |
| worldScale | number | 0.0068 | 每个采样像素对应的世界单位 |
| offsetY | number | 0.55 | 文字中心在世界坐标中的纵向偏移 |
| autoPlay | boolean | true | 对象创建后是否自动播放一次 |
| autoPlayDelay | number | 1.2 | 自动播放前的等待时间（秒） |
| seed | number | 1 | 每个粒子随机数的确定性种子 |

## 成员

| 名称 | 类型 | 描述 |
|------|------|------|
| points | THREE.Mesh | 主粒子层 |
| trail | THREE.Mesh | 由同一批粒子组成、略微延迟且更暗的拖尾层 |
| text | string | 当前被采样成粒子云的文字 |
| particleCount | number | 字形粒子数量 |
| duration | number | 一次升空 / 炸开 / 回落周期的时长（秒） |
| phase | number | 当前时间轴位置（秒） |
| playing | boolean | 时间轴当前是否在推进 |

## 方法

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (options?: TextFireworksOptions) | 创建效果。它继承自 `THREE.Group`，直接加入场景并通过 `position` 摆放 |
| setText | (text: string) => void | 采样新文字并重建粒子。空白文字会被忽略 |
| launch | () => void | 重新开始升空 / 炸开 / 回落周期 |
| update | (deltaSeconds: number) => void | 手动推进时间轴，内部动画循环每帧调用 |
| dispose | () => void | 停止动画、释放几何体与材质并从场景中移除。组件卸载时应调用以避免内存泄漏 |
