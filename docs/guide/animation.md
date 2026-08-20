---
lang: en-US
title: Animation
---

## Type

Class

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Animation from '@site/src/components/Animation'

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Animation rendererType="webgpu" />

    ```tsx
    import { Scene, GLTFLoader, Animation } from 'react-three-lite'

    function App() {
      const handleCreated = async (scene, { camera }) => {
        scene.position.set(0, -0.5, 0)
        camera.position.set(0, 1.5, 3)

        const model = await GLTFLoader('/models/perseverance-draco.glb', true)
        scene.add(model)

        const animation = new Animation(model)
        animation.playAll()
      }

      return (
        <Scene 
          rendererType="webgpu"
          style={{ marginTop: '10px', width: '100%', height: '300px' }} 
          bgColor="#FAEBD7" 
          onCreated={handleCreated} 
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Animation rendererType="webgl" />

    ```tsx
    import { Scene, GLTFLoader, Animation } from 'react-three-lite'

    function App() {
      const handleCreated = async (scene, { camera }) => {
        scene.position.set(0, -0.5, 0)
        camera.position.set(0, 1.5, 3)

        const model = await GLTFLoader('/models/perseverance-draco.glb', true)
        scene.add(model)

        const animation = new Animation(model)
        animation.playAll()
      }

      return (
        <Scene 
          rendererType="webgl"
          style={{ marginTop: '10px', width: '100%', height: '300px' }} 
          bgColor="#FAEBD7" 
          onCreated={handleCreated} 
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## Methods

| Name                 | Parameters                                                                                    | Description                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| constructor          | (obj: THREE.Mesh \| THREE.Group \| THREE.Object3D, animations?: THREE.AnimationClip[]) => void | `obj` is the mesh or group containing the animation; `animations` optional animation clips array.                                                                 |
| set                  | (index: number) => this                                                                       | `index` is the index of the animation to play. The default is 0.                                                                                                 |
| setByName            | (name: string) => this                                                                        | `name` is the name of the animation to play.                                                                                                                     |
| setLoop              | (loop: typeof THREE.LoopOnce \| typeof THREE.LoopRepeat \| typeof THREE.LoopPingPong) => this | `loop` is the loop mode. The default is LoopRepeat.                                                                                                              |
| setTimeScale         | (timeScale: number) => this                                                                   | `timeScale` is the time scale of the animation.                                                                                                                  |
| setClampWhenFinished | (clampWhenFinished: boolean) => this                                                          | `clampWhenFinished` is the clamp when finished of the animation.                                                                                                 |
| play                 | () => void                                                                                    | Play the animation. Default is the first animation of the mesh contained. If you want to play a specific animation, you need to call `set` or `setByName` first. |
| playAll              | () => void                                                                                    | Play all animations of the mesh contained.                                                                                                                       |
| stop                 | () => void                                                                                    | Stop the animation. Only stop the animation using `play` method played.                                                                                          |
| stopAll              | () => void                                                                                    | Stop all animations using `playAll` method played.                                                                                                               |
| pause                | () => void                                                                                    | Pause the animation. Only pause the animation using `play` method played.                                                                                        |
| pauseAll             | () => void                                                                                    | Pause all animations using `playAll` method played.                                                                                                              |
