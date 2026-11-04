---
lang: zh-CN
title: 沙滩漫步
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SandyBeach from '@site/src/components/effects/SandyBeach'

第一人称的黎明海滩漫步。小岛是一个周长 260 米的环形海岸，沙面高度、湿沙带、海浪起伏与脚印共用同一套海岸坐标，因此无论走到哪个角度，水线、行走者与着色器都始终对齐。天空由解析式求值，并复用于水面与湿沙的反射，让 WebGPU 与 WebGL 渲染器得到同一份单遍结果。

拖动可以环顾四周，用 `WASD` 或方向键行走，滚轮向前迈出一步。脚印写入一个很小的环形缓冲，再被潮水慢慢抹去。

## 类型

组件

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SandyBeach />

    ```tsx
    import { Scene, SandyBeach } from 'react-three-lite'

    function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
      return (
        <Scene
          rendererType={rendererType}
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <SandyBeach preset="sunrise" />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SandyBeach rendererType="webgl" />

    ```tsx
    import { Scene, SandyBeach } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        >
          <SandyBeach preset="sunrise" />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

## 交互

- **拖动**转动视角。视角拖动只绑定在画布上，因此环顾时页面不会跟着滚动。
- **`W` / `A` / `S` / `D`** 或**方向键**在沙滩上行走。只有指针位于画布上方时键盘输入才会生效。
- **滚轮**以一次短促的推力向前迈步，而不是连续缩放。
- 行走者被限制在沙滩环内，摄像机不会走进海里，也不会爬上内陆的坡地。

## 配置项

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| preset | 'sunrise' \| 'morning' \| 'sunset' \| 'night' \| 'blueHour' | 'sunrise' | 一天中的时段预设。切换时天空、水面与沙地颜色会交叉淡入 |
| autoWalk | boolean | false | 自动向前行走，适合做背景动画 |
| crouching | boolean | false | 把摄像机降低到蹲下的视高 |
| interactive | boolean | true | 为画布绑定拖动视角、`WASD` / 方向键与滚轮迈步 |

## 预设

| 预设 | 描述 |
|------|------|
| sunrise | 温暖的低角度阳光，桃色地平线与冷色高空 |
| morning | 高角度阳光，浅色地平线与明亮的青绿浅滩 |
| sunset | 阳光几乎贴在水面上，橙色余晖与紫罗兰色天顶 |
| night | 月亮、星空与幽暗的蓝色环境光 |
| blueHour | 太阳刚落到地平线下，粉色余晖与深蓝紫色天空 |

## 说明

- 组件挂载期间接管摄像机。它会保存之前的摄像机姿态、视场角与近远裁剪面，禁用场景的 `OrbitControls`，并在卸载时全部还原。
- 场景由天空球、沙地环与海洋环组成，全部使用 TSL 节点材质，因此两个渲染器编译的是同一份着色器。
- 所有几何体、材质、纹理与事件监听都会在卸载时释放。
