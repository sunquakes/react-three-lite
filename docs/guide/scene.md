---
lang: en-US
title: Scene
---

import SceneComponent from '@site/src/components/Scene'
import SceneBgColor from '@site/src/components/SceneBgColor'
import SceneBgImage from '@site/src/components/SceneBgImage'

## Type

Component

## Default Usage

<SceneComponent />

```tsx
import { Scene } from 'react-three-lite'

function App() {
  return (
    <Scene style={{ marginTop: '10px', width: '100%', height: '300px' }} />
  )
}
```

## Color As Background

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

## Image As Background

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

## Props

| Name          | Type                        | Default                 | Description                                                                                            |
| ------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| modelValue    | THREE.Scene                 | THREE.Scene             | `optional` The value will be the `THREE.Scene` instance from `undefined` after the components mounted. |
| renderer      | THREE.WebGLRenderer         | THREE.WebGLRenderer     | `optional`                                                                                             |
| bgColor       | String                      |                         | `optional` The background color of the scene.                                                          |
| bgImage       | String                      |                         | `optional` The background image of the scene.                                                           |
| camera        | THREE.Camera                | THREE.PerspectiveCamera | `optional` Defaults to a PerspectiveCamera.                                                            |
| light         | THREE.Light                 | THREE.HemisphereLight   | `optional` Defaults to a HemisphereLight.                                                              |
| axesHelper    | THREE.AxesHelper \| boolean | THREE.AxesHelper        | `optional` Defaults to a AxesHelper, `false` to hide it.                                               |
| controls      | OrbitControls \| boolean    | OrbitControls           | `optional` Defaults to a OrbitControls, `false` to disable it.                                         |

## Events

| Name          | Parameters                                                                                                      | Description                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| onCreated     | (scene, &#123;camera, light, axesHelper, controls&#125;) => void                                                         | Called when the component is mounted and the scene is created. |
| onBeforeFrame | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called before each frame is rendered.                         |
| onFrame       | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called during each frame render loop.                         |
| onAfterFrame  | (renderer: THREE.WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called after each frame is rendered.                          |
