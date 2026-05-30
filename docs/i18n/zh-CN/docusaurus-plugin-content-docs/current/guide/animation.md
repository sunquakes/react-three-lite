---
title: 动画
---

## 类型

类

import Animation from '@site/src/components/Animation'

## 默认用法

<Animation />

```tsx
import { Scene, GLTFLoader, Animation } from 'react-three-lite'

function App() {
  const handleCreated = async (scene, { camera }) => {
    scene.position.set(0, -0.5, 0)
    camera.position.set(0, 1.5, 3)

    const model = await GLTFLoader('/models/perseverance.glb')
    scene.add(model)

    const animation = new Animation(model)
    animation.playAll()
  }

  return (
    <Scene
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
      bgColor="#FAEBD7"
      onCreated={handleCreated}
    />
  )
}
```

## 方法

| 名称                 | 参数                                                                                          | 描述                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| constructor          | (obj: THREE.Mesh \| THREE.Group \| THREE.Object3D, animations?: THREE.AnimationClip[]) => void | `obj` 传 THREE.Mesh、THREE.Group 或 THREE.Object3D 对象；`animations` 可选的动画片段数组。    |
| set                  | (index: number) => this                                                                       | `index` 当前播放的动画索引。                                                                 |
| setByName            | (name: string) => this                                                                        | `name` 当前动画的名称。                                                                      |
| setLoop              | (loop: typeof THREE.LoopOnce \| typeof THREE.LoopRepeat \| typeof THREE.LoopPingPong) => this | `loop` 当前动画播放循环方式。                                                                |
| setTimeScale         | (timeScale: number) => this                                                                   | `timeScale` 当前动画播放速度。                                                               |
| setClampWhenFinished | (clampWhenFinished: boolean) => this                                                          | `clampWhenFinished` 当前动画是否在播放完成时停止。                                           |
| play                 | () => void                                                                                    | 播放动画。默认播放 mesh 中第一个动画。如果要播放特定的动画，需要先调用 `set` 或`setByName` 方法。 |
| playAll              | () => void                                                                                    | 播放模型中的所有动画。                                                                       |
| stop                 | () => void                                                                                    | 停止动画，只能停止使用 `play` 方法播放的动画。                                               |
| stopAll              | () => void                                                                                    | 停止所有动画。只能停止使用 `playAll` 方法播放的动画。                                        |
| pause                | () => void                                                                                    | 暂停动画，只能暂停使用 `play` 方法播放的动画。                                               |
| pauseAll             | () => void                                                                                    | 暂停所有动画。只能暂停使用 `playAll` 方法播放的动画。                                        |
