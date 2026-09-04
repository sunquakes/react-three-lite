***

id: picking
lang: en-US
title: Picking
--------------

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Picking from '@site/src/components/Picking'

## Type

Component (Scene props) / Class (standalone)

## Default Usage

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Picking />
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Picking rendererType="webgl" />
  </TabItem>
</Tabs>

```tsx
import { useRef } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents, PickEvent } from 'react-three-lite'
import * as THREE from 'three'

function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
  const hoveredRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return
    camera.position.set(0, 1, 6)
    camera.lookAt(0, 0, 0)

    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
    const material = new THREE.MeshStandardMaterial({ color: 0x4fc3f7 })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  }

  const handleClick = (event: PickEvent | null) => {
    if (!event) return
    const material = (event.object as THREE.Mesh).material as THREE.MeshStandardMaterial
    material.color.setHex(Math.random() * 0xffffff)
  }

  // `onHover` only fires when the object under the pointer changes, so keep a
  // reference to the previously hovered mesh in order to restore it.
  const handleHover = (event: PickEvent | null) => {
    const previous = hoveredRef.current
    if (previous) {
      const material = previous.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x000000)
    }

    const mesh = event ? (event.object as THREE.Mesh) : null
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x444444)
    }
    hoveredRef.current = mesh
  }

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      onClick={handleClick}
      onHover={handleHover}
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', width: '100%', height: '300px' }}
    />
  )
}
```

## Scene Props

| Name          | Type                                 | Default | Description                                                                                   |
| ------------- | ------------------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| onClick       | `(event: PickEvent \| null) => void` | —       | Fired on a click (pointer down + up within the threshold)                                     |
| onHover       | `(event: PickEvent \| null) => void` | —       | Fired when the object under the pointer changes, or `null` when the pointer leaves the canvas |
| pickFilter    | `(object: Object3D) => boolean`      | —       | Optional predicate to filter which objects are pickable                                       |
| pickRecursive | `boolean`                            | `true`  | Traverse children of the scene when picking                                                   |

## Picker Class

For advanced use cases, the `Picker` class can be imported and used directly.

```tsx
import { Picker } from 'react-three-lite'
import type { PickEvent, PickerOptions } from 'react-three-lite'
import * as THREE from 'three'

const picker = new Picker(scene, camera, renderer.domElement, {
  recursive: true,
  filter: (object) => object.name !== 'non-pickable',
  clickThreshold: 5,
})

picker.on('click', (event: PickEvent | null) => {
  if (event) console.log('clicked', event.object.name)
})

picker.on('hover', (event: PickEvent | null) => {
  if (event) console.log('hovered', event.object.name)
})

// Cleanup
picker.dispose()
```

## PickerOptions

| Property       | Type                            | Default | Description                                                     |
| -------------- | ------------------------------- | ------- | --------------------------------------------------------------- |
| targets        | `Object3D[]`                    | —       | Objects to test against, defaults to the whole scene            |
| recursive      | `boolean`                       | `true`  | Traverse descendants of the targets                             |
| filter         | `(object: Object3D) => boolean` | —       | Keep only intersections that pass this predicate                |
| enableHover    | `boolean`                       | `true`  | Emit hover events on pointer move                               |
| clickThreshold | `number`                        | `5`     | Max pointer travel (px) between down and up to count as a click |
| layers         | `number \| number[]`            | —       | Camera layers to pick from, default: all layers                 |
| near           | `number`                        | —       | Raycaster near plane                                            |
| far            | `number`                        | —       | Raycaster far plane                                             |

## PickEvent

| Property      | Type                        | Description                                                  |
| ------------- | --------------------------- | ------------------------------------------------------------ |
| object        | `Object3D`                  | The intersected object                                       |
| point         | `Vector3`                   | Intersection point in world space                            |
| distance      | `number`                    | Distance from the camera to the intersection point           |
| intersection  | `Intersection`              | The closest intersection that passed the filter              |
| intersections | `Intersection[]`            | All intersections that passed the filter, sorted by distance |
| pointer       | `Vector2`                   | Pointer position in normalized device coordinates            |
| nativeEvent   | `PointerEvent \| undefined` | The originating pointer event, absent for programmatic picks |

## Picker Methods

| Name        | Parameters                                                | Description                                            |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------ |
| constructor | `(scene, camera, domElement, options?)`                   | Create a new Picker instance                           |
| on          | `(type: 'click' \| 'hover', listener) => () => void`      | Subscribe to an event, returns an unsubscribe function |
| off         | `(type: 'click' \| 'hover', listener) => void`            | Unsubscribe from an event                              |
| pickAt      | `(clientX: number, clientY: number) => PickEvent \| null` | Programmatically pick at a client position             |
| setTargets  | `(targets?: Object3D[]) => void`                          | Replace the objects to test against                    |
| setFilter   | `(filter?: (object) => boolean) => void`                  | Replace the intersection filter                        |
| setEnabled  | `(enabled: boolean) => void`                              | Enable or disable the picker                           |
| getHovered  | `() => Object3D \| null`                                  | The object currently under the pointer                 |
| dispose     | `() => void`                                              | Detach listeners and release resources                 |

