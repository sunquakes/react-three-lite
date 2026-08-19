---
id: scene
lang: en-US
title: Scene
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Scene from '@site/src/components/Scene'
import SceneBgColor from '@site/src/components/SceneBgColor'
import SceneBgImage from '@site/src/components/SceneBgImage'

## Type

Component

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Scene rendererType="webgpu" />

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
    <Scene rendererType="webgl" />

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

## Color As Background

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

## Image As Background

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

## Props

| Name          | Type                        | Default                 | Description                                                                                            |
| ------------- | --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| modelValue    | THREE.Scene                 | THREE.Scene             | `optional` The value will be the `THREE.Scene` instance from `undefined` after the components mounted. |
| renderer      | WebGPURenderer \| WebGLRenderer |                     | `optional` Provide a custom renderer instance. Takes precedence over `rendererType`.                  |
| rendererType  | 'webgpu' \| 'webgl'         | 'webgpu'                | `optional` Renderer backend. `'webgpu'` uses `WebGPURenderer` (falls back to the WebGL2 backend when WebGPU is unavailable), `'webgl'` uses the classic `WebGLRenderer`. |
| bgColor       | String                      |                         | `optional` The background color of the scene.                                                          |
| bgImage       | String                      |                         | `optional` The background image of the scene.                                                           |
| camera        | THREE.Camera                | THREE.PerspectiveCamera | `optional` Defaults to a PerspectiveCamera.                                                            |
| light         | THREE.Light                 | THREE.HemisphereLight   | `optional` Defaults to a HemisphereLight.                                                              |
| axesHelper    | THREE.AxesHelper \| boolean | THREE.AxesHelper        | `optional` Defaults to a AxesHelper, `false` to hide it.                                               |
| gridHelper    | THREE.GridHelper \| boolean | THREE.GridHelper        | `optional` Defaults to a GridHelper, `false` to hide it.                                                 |
| controls      | OrbitControls \| boolean    | OrbitControls           | `optional` Defaults to a OrbitControls, `false` to disable it.                                         |

## Events

| Name          | Parameters                                                                                                      | Description                                                    |
| ------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| onCreated     | (scene, &#123;camera, light, axesHelper, controls&#125;) => void                                                         | Called when the component is mounted and the scene is created. |
| onBeforeFrame | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called before each frame is rendered.                         |
| onFrame       | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called during each frame render loop.                         |
| onAfterFrame  | (renderer: WebGPURenderer \| WebGLRenderer, scene: THREE.Scene, components: &#123;camera, light, axesHelper, controls&#125;) => void | Called after each frame is rendered.                          |
