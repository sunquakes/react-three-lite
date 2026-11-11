---
id: force-shield
lang: en-US
title: Force Shield
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import ForceShield from '@site/src/components/effects/ForceShield'

## Type

Class

A hexagonally tiled energy shield that wraps a sphere. The surface combines a fresnel rim, two layers of flowing noise and a triplanar hex grid, then dissolves through noise when it is lowered. Impacts are stored in a six-slot ring buffer, so every hit draws an expanding ring and a contact highlight without the CPU touching the shader again. Health fades the shield towards red as it is drained.

The class animates itself: time, dissolve and impact timers are advanced from `onBeforeRender`, so you never need a per-frame update.

## Default Usage

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <ForceShield />
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <ForceShield rendererType="webgl" />
  </TabItem>
</Tabs>

```tsx
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, ForceShield } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
  const shieldRef = useRef<ForceShield | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 0.8, 4.6)
    camera.lookAt(0, 0, 0)

    const shield = new ForceShield({ radius: 1.8 })
    scene.add(shield)
    shieldRef.current = shield

    // Landing a hit at a point on the surface
    shield.hit(new THREE.Vector3(0, 0.6, 1.7))
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shieldRef.current?.dispose()
      shieldRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| radius | number | `1.8` | Sphere radius. |
| active | boolean | `true` | Whether the shield starts raised. `false` starts it fully dissolved. |
| reveal | number | - | Freeze the dissolve at this progress (`0` visible, `1` dissolved). Overrides `active` and the automatic animation. |
| revealSpeed | number | `3.5` | Speed of the automatic dissolve and raise animation. |
| color | ColorRepresentation | `0x26aeff` | Base shield colour. |
| opacity | number | `0.76` | Overall surface opacity. |
| hexScale | number | `3` | Hex grid tiling. |
| hexOpacity | number | `0.13` | Hex cell brightness. |
| showHex | boolean | `true` | Draw the hexagonal cell grid. |
| edgeWidth | number | `0.06` | Hex seam width. |
| fresnelPower | number | `1.8` | Fresnel falloff exponent. |
| fresnelStrength | number | `1.75` | Fresnel rim brightness. |
| fadeStart | number | `0` | Object-space `y` below which the shield fades out. `-1` disables the fade. |
| flashSpeed | number | `0.6` | Cell flicker speed. |
| flashIntensity | number | `0.11` | Cell flicker brightness. |
| noiseScale | number | `1.3` | Dissolve noise scale. |
| noiseEdgeColor | ColorRepresentation | `0x26aeff` | Colour of the dissolve edge. |
| noiseEdgeWidth | number | `0.02` | Width of the dissolve edge. |
| noiseEdgeIntensity | number | `10` | Brightness of the dissolve edge. |
| noiseEdgeSmoothness | number | `0.5` | Sharpness of the dissolve edge. |
| flowScale | number | `2.4` | Flow noise scale. |
| flowSpeed | number | `1.13` | Flow noise speed. |
| flowIntensity | number | `4` | Flow noise brightness. |
| hitRingSpeed | number | `1.75` | Speed of the impact ring. |
| hitRingWidth | number | `0.12` | Thickness of the impact ring. |
| hitMaxRadius | number | `0.85` | Maximum angular radius of the impact ring. |
| hitDuration | number | `1.8` | Seconds an impact stays visible. |
| hitIntensity | number | `4.1` | Brightness of the impact. |
| hitImpactRadius | number | `0.3` | Angular radius of the contact highlight. |
| hitDamage | number | `5` | Health removed per hit, in percent. |
| life | number | `1` | Initial health (`1` intact, `0` depleted). Lower values tint the shield red. |

## Properties

| Name | Type | Description |
|------|------|-------------|
| active | boolean | Whether the shield is raised. Writing it toggles the automatic dissolve. |
| reveal | number | Current dissolve progress (`0` visible, `1` dissolved). Writing it freezes the animation. |
| life | number | Current health, clamped to `0`-`1`. |
| shieldRadius | number | Radius passed to the constructor. |

## Methods

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (options?: ForceShieldOptions) => void | Creates the shield mesh. It is not added to a scene automatically. |
| setActive | (active: boolean) => void | Raise or dissolve the shield and resume the automatic animation. |
| hit | (point?: THREE.Vector3, damage?: number) => void | Fire an impact at a world-space point (defaults to a random surface point) and remove `damage` percent of health (defaults to `hitDamage`). |
| dispose | () => void | Remove the shield from its parent and release the geometry and material. |
