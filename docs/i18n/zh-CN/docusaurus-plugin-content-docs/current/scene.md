---
title: 场景
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import SceneComponent from '@site/src/components/Scene'
import SceneBgColor from '@site/src/components/SceneBgColor'
import SceneBgImage from '@site/src/components/SceneBgImage'

## 类型

组件

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SceneComponent rendererType="webgpu" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgpu"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SceneComponent rendererType="webgl" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 颜色背景

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SceneBgColor rendererType="webgpu" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgpu"
          style={{ marginTop: '10px', width: '100%', height: '400px' }}
          bgColor="#98F5F9"
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SceneBgColor rendererType="webgl" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '400px' }}
          bgColor="#98F5F9"
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 图片背景

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <SceneBgImage rendererType="webgpu" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgpu"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
          bgImage="/images/examples/bg.jpg"
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <SceneBgImage rendererType="webgl" />

    ```tsx
    import { Scene } from 'react-three-lite'

    function App() {
      return (
        <Scene
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }}
          bgImage="/images/examples/bg.jpg"
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## 属性

| 名称          | 类型                        | 默认值                  | 描述                                                                                                   |
| ------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| modelValue    | THREE.Scene                 | THREE.Scene             | `可选` 组件挂载后，值将变为 `THREE.Scene` 实例。                                                       |
| renderer      | WebGPURenderer \| WebGLRenderer |                     | `可选` 传入自定义渲染器实例，优先级高于 `rendererType`。                                                |
| rendererType  | 'webgpu' \| 'webgl'         | 'webgpu'                | `可选` 渲染器后端。`'webgpu'` 使用 `WebGPURenderer`（WebGPU 不可用时自动回退到 WebGL2 后端），`'webgl'` 使用经典 `WebGLRenderer`。 |
| bgColor       | String                      |                         | `可选` 场景的背景颜色。                                                                                |
| bgImage       | String                      |                         | `可选` 场景的背景图片。                                                                                |
| camera        | THREE.Camera                | THREE.PerspectiveCamera | `可选` 默认为 PerspectiveCamera。                                                                      |
| light         | THREE.Light                 | THREE.HemisphereLight   | `可选` 默认为 HemisphereLight。                                                                        |
| axesHelper    | THREE.AxesHelper \| boolean | THREE.AxesHelper        | `可选` 默认为 AxesHelper，设为 `false` 隐藏。                                                          |
| gridHelper    | THREE.GridHelper \| boolean | THREE.GridHelper        | `可选` 默认为 GridHelper，设为 `false` 隐藏。                                                          |
| controls      | OrbitControls \| boolean    | OrbitControls           | `可选` 默认为 OrbitControls，设为 `false` 禁用。                                                       |

## 事件

| 名称          | 参数                                                                                                                        | 描述                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| onCreated     | (scene, &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void                                                | 组件挂载并创建场景时调用。          |
| onBeforeFrame | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染前调用。                   |
| onFrame       | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染时调用。                   |
| onAfterFrame  | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染后调用。                   |
