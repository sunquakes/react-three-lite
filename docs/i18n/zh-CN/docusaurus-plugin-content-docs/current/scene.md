---
title: 场景
---

import SceneComponent from '@site/src/components/Scene'
import SceneBgColor from '@site/src/components/SceneBgColor'
import SceneBgImage from '@site/src/components/SceneBgImage'

## 类型

组件

## 默认用法

<SceneComponent />

```tsx
import { Scene } from 'react-three-lite'

function App() {
  return (
    <Scene style={{ marginTop: '10px', width: '100%', height: '300px' }} />
  )
}
```

## 颜色背景

<SceneBgColor />

```tsx
import { Scene } from 'react-three-lite'

function App() {
  return (
    <Scene 
      style={{ marginTop: '10px', width: '100%', height: '400px' }} 
      bgColor="#98F5F9" 
    />
  )
}
```

## 图片背景

<SceneBgImage />

```tsx
import { Scene } from 'react-three-lite'

function App() {
  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      bgImage="/images/examples/bg.jpg"
    />
  )
}
```

## 属性

| 名称          | 类型                        | 默认值                  | 描述                                                                                                   |
| ------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| modelValue    | THREE.Scene                 | THREE.Scene             | `可选` 组件挂载后，值将变为 `THREE.Scene` 实例。                                                       |
| renderer      | THREE.WebGLRenderer         | THREE.WebGLRenderer     | `可选`                                                                                                 |
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
| onBeforeFrame | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染前调用。                   |
| onFrame       | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染时调用。                   |
| onAfterFrame  | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, gridHelper, controls&#125;) => void | 每帧渲染后调用。                   |
