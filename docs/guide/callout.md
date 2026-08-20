---
id: callout
lang: en-US
title: Callout
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import Callout from '@site/src/components/Callout'

## Type

Class

## Default Usage

Every example below can be viewed with either the **WebGPU** (default) or the **WebGL** renderer — switch tabs to compare.

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <Callout rendererType="webgpu" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, Callout } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const calloutRef = useRef<Callout | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 0, 5)
        camera.lookAt(0, 0, 0)

        // A box at the origin that the annotation points to.
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        )
        scene.add(box)

        // Callout: start (anchor) on the box surface, end (label) on the right side.
        // autoAnchor makes the label's bottom-edge connection point follow the
        // camera — call updateLabelAnchor(camera) every frame.
        const callout = new Callout(
          [0.5, 0.5, 0.5],                     // start (anchor) — box corner
          [1.5, 1.0, 0.5],                     // end (label) — right of the box
          <div style={{
            padding: '8px 14px',
            background: 'linear-gradient(180deg, #ff8a2b 0%, #e66400 100%)',
            borderRadius: '4px',
            color: '#1a0f00',
            fontSize: '16px',
            fontWeight: 600
          }}>This is a box!</div>,
          {
            color: '#ffffff',
            lineWidth: 2,
            lineShape: 'broken',               // 'straight' | 'broken'
            bendAxis: 'x',                     // 'auto' | 'x' | 'y' | 'z'
            bendRatio: 2 / 3,                  // diagonal's horizontal projection = 1/3 of total horizontal
            autoAnchor: true,                  // connection point slides on bottom edge by direction
            showDot: true,
            dotColor: '#ffffff',
            dotRadius: 0.06
          }
        )
        scene.add(callout.scene)
        callout.attach(camera)                  // start internal autoAnchor loop
        calloutRef.current = callout
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          calloutRef.current?.dispose()
          calloutRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgpu"
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '360px' }}
          onCreated={handleCreated}
        />
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <Callout rendererType="webgl" />

    ```tsx
    import { useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { Scene, Callout } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    export default function App() {
      const calloutRef = useRef<Callout | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera } = components
        if (!camera) return

        camera.position.set(0, 0, 5)
        camera.lookAt(0, 0, 0)

        // A box at the origin that the annotation points to.
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        )
        scene.add(box)

        // Callout: start (anchor) on the box surface, end (label) on the right side.
        // autoAnchor makes the label's bottom-edge connection point follow the
        // camera — call updateLabelAnchor(camera) every frame.
        const callout = new Callout(
          [0.5, 0.5, 0.5],                     // start (anchor) — box corner
          [1.5, 1.0, 0.5],                     // end (label) — right of the box
          <div style={{
            padding: '8px 14px',
            background: 'linear-gradient(180deg, #ff8a2b 0%, #e66400 100%)',
            borderRadius: '4px',
            color: '#1a0f00',
            fontSize: '16px',
            fontWeight: 600
          }}>This is a box!</div>,
          {
            color: '#ffffff',
            lineWidth: 2,
            lineShape: 'broken',               // 'straight' | 'broken'
            bendAxis: 'x',                     // 'auto' | 'x' | 'y' | 'z'
            bendRatio: 2 / 3,                  // diagonal's horizontal projection = 1/3 of total horizontal
            autoAnchor: true,                  // connection point slides on bottom edge by direction
            showDot: true,
            dotColor: '#ffffff',
            dotRadius: 0.06
          }
        )
        scene.add(callout.scene)
        callout.attach(camera)                  // start internal autoAnchor loop
        calloutRef.current = callout
      }

      // Cleanup on unmount
      useEffect(() => {
        return () => {
          calloutRef.current?.dispose()
          calloutRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="#1a1a2e"
          style={{ marginTop: '10px', width: '100%', height: '360px' }}
          onCreated={handleCreated}
        />
      )
    }
    ```
  </TabItem>
</Tabs>

## Options

| Property     | Type                          | Default     | Description                                                                       |
| ------------ | ----------------------------- | ----------- | --------------------------------------------------------------------------------- |
| color        | number \| string              | 0xffffff    | Line (and default dot) color. Accepts hex number or CSS color string.             |
| lineWidth    | number                        | 1           | Line width (only effective in WebGL2 contexts).                                   |
| lineShape    | `'straight' \| 'broken'`      | `'broken'`  | Shape of the leader: direct line, or L-shape with a corner.                        |
| bendAxis     | `'auto' \| 'x' \| 'y' \| 'z'` | `'auto'`    | (broken only) Which axis is used for the label-parallel segment; `auto` picks the axis with largest delta. |
| bendRatio    | number                        | 0.45        | (broken only) Ratio (0–1) from label towards anchor along bendAxis where the corner sits. Guarantees an **obtuse** corner angle at any value strictly between 0 and 1 (0→flat/180°, 1→right-angle/90°). |
| labelAnchor  | LabelAnchor                   | 'bottom-left' | Which corner/point of the ReactNode label is placed at the `end` coordinate. `'center'` \| `'top-left'` \| `'top-right'` \| `'bottom-left'` \| `'bottom-right'`. Ignored when `autoAnchor` is true. |
| autoAnchor   | boolean                       | false       | When true, the connection point slides along the label's **bottom edge** based on the SCREEN-SPACE horizontal direction from `end` to `start` (computed from the camera each frame via an internal rAF loop started by `attach(camera)`). Start left of end on screen → bottom-left corner; start right → bottom-right corner; nearly above/below → bottom-center. A `smoothstep` with a small threshold ensures the connection point fully reaches the corners as soon as there is a clear horizontal offset. Overrides `labelAnchor`. |
| dashed       | boolean                       | false       | Use a dashed line. When true, `dashSize` and `gapSize` apply.                     |
| dashSize     | number                        | 0.1         | Dash length for dashed lines.                                                     |
| gapSize      | number                        | 0.05        | Gap length for dashed lines.                                                      |
| showDot      | boolean                       | true        | Show an anchor dot at the start point.                                            |
| dotColor     | number \| string              | same as color | Anchor dot color.                                                                 |
| dotRadius    | number                        | 0.05        | Anchor dot radius.                                                                |
| showLabel    | boolean                       | true        | Show the React-rendered label at the end point.                                   |

## Methods

| Name         | Parameters                                                                            | Description                                                                                          |
| ------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| constructor  | <code>(start: Position, end: Position, component: ReactNode, options?: CalloutOptions) => void</code> | Creates a Callout. `start` is the anchor point, `end` is the label position, `component` is the label content. |
| moveTo       | <code>(end: Position, duration: number) => void</code>                                | Animate the label (end point) to a new position. `duration` is in milliseconds.                     |
| setStart     | <code>(start: Position) => void</code>                                                | Instantly update the anchor (start) point, regenerating the broken corner.                           |
| setEnd       | <code>(end: Position) => void</code>                                                  | Instantly update the label (end) point, regenerating the broken corner.                              |
| setLineShape | <code>(shape: LineShape, opts?: &#123; bendAxis?: BendAxis; bendRatio?: number &#125;) => void</code> | Switch line shape at runtime, optionally reconfiguring bend behaviour.                               |
| attach       | <code>(camera: THREE.Camera) => void</code>                                          | Attach a camera and start the internal rAF loop so the label connection point follows the camera when `autoAnchor` is true. Call once after adding to the scene. |
| detach       | <code>() => void</code>                                                              | Stop the internal autoAnchor rAF loop. Safe to call multiple times.                                  |
| dispose      | <code>() => void</code>                                                               | Dispose the callout and release all resources (geometry, material, label root, DOM node, rAF loops). |
