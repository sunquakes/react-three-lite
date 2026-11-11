---
name: react-three-lite
description: Builds 3D scenes in React apps with react-three-lite — Scene, effects, model loaders, popups, and GIS layers. Invoke when adding 3D content, a model viewer, a particle effect, or a map layer to a React project.
---

# React Three Lite

React components and classes that wrap Three.js, so a React app can show 3D
content without writing its own render loop.

Everything this skill uses is imported from the package root:

```tsx
import { Scene, Rain, Bloom } from 'react-three-lite'
```

Always use a namespace import for Three.js itself:

```tsx
import * as THREE from 'three'
```

## Install

`three` is a peer dependency, so install both, then import the components:

```bash
pnpm i three react-three-lite
```

## Golden path

```tsx
import * as THREE from 'three'
import { Scene, Rain } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App() {
  const handleCreated = (scene: THREE.Scene, { camera, controls }: SceneComponents) => {
    camera.position.set(0, 4, 12)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  return (
    <Scene
      bgColor="rgb(40, 42, 54)"
      style={{ width: '100%', height: '100%' }}
      onCreated={handleCreated}
    >
      <Rain count={3000} speed={0.8} color={0x87ceeb} />
    </Scene>
  )
}
```

`Scene` owns the renderer, camera, light, axes/grid helpers, `OrbitControls`
and the animation loop. Do not create a renderer, an `OrbitControls`, or call
`setAnimationLoop` yourself.

There are two ways a feature enters the scene:

- **Declarative components** (`Rain`, `Snow`, `Bloom`, loaders, GIS layers) are
  rendered from JSX and dispose themselves on unmount.
- **Imperative classes** (`SkyDome`, `Fireworks`, `GlowSprite`, `Popup`,
  `Callout`, ...) are constructed in `onCreated`, added with
  `scene.add(instance)` — or `scene.add(instance.scene)` for classes that expose
  a `scene` — and disposed in a `useEffect` cleanup.

Prefer a component when one exists. Use a class when the docs page lists the
feature as `Class`, or when instances are created dynamically.

## Renderers

- WebGPU is the default: `<Scene />`.
- WebGL is opt-in: `<Scene rendererType="webgl" />`.
- A `renderer` prop accepts a custom renderer instance and overrides
  `rendererType`.

Every feature must work on **both** backends. A feature that renders on only one
is unfinished: check `<Scene />` and `<Scene rendererType="webgl" />` before
reporting success.

## API inventory

Components: `Scene`, `Bloom`, `Rain`, `Snow`, `HeightFog`, `Water`,
`WaterPool`, `SandyBeach`, `GeoObject`, `GeoJsonLayer`, `TileLayer`,
`GLTFLoader`, `FBXLoader`, `OBJLoader`.

Classes: `SkyBox`, `Popup`, `Callout`, `Movable`, `Animation`,
`ModelRotator`, `Picker`, `SweepLight`, `LightGradient`, `LightPillar`,
`Fireworks`, `SkyDome`, `RadarSweep`, `SignalWave`, `GlowSprite`,
`TextFireworks`, `NebulaGalaxy`, `ForceShield`, `WaveCircleMesh`,
`FlowLineMesh`, `FitCamera`, `ParameterBus`.

Functions: `GLTFLoaderAsync` / `FBXLoaderAsync` / `OBJLoaderAsync`,
`disposeModel`, `disposeDRACOLoader`, `fitCameraToBox`, `fitCameraToObject`,
`fitCameraToPoints`, `fitCameraToGeoPoints`, plus the GIS helpers exported from
`GeoReference` / `crs`.

Shared state: `globalParameterBus` (a `ParameterBus` instance) holds the
parameters consumed by several effects. It currently exposes `sunDirection`,
which `SkyDome`, `Water`, `WaterPool` and `HeightFog` read, so the sun is set
once with
`globalParameterBus.set('sunDirection', new THREE.Vector3(x, y, z))` instead of
passing a prop to every effect.

## Rules

1. **Let effects animate themselves.** Most R3L features animate on their own
   (pulse periods, launch loops, shader time uniforms). Add `onBeforeFrame` only
   for state R3L does not own, and remove that callback on unmount.
2. **Dispose everything you allocate.** Geometries, materials, textures, class
   instances (`instance.dispose()`), objects added to the scene
   (`scene.remove(object)`), and event listeners. Components in JSX already do
   this for themselves.
3. **Set the camera from the docs demo.** For a loaded model use `FitCamera` or
   `fitCameraToObject` instead of guessing coordinates.
4. **Textures:** an sRGB image needs
   `texture.colorSpace = THREE.SRGBColorSpace`. The model loaders normalise
   GLTF/FBX/OBJ maps; raw textures you create need this set by hand.
5. **PBR needs light.** `Scene` defaults to a single `HemisphereLight`. For
   metallic/rough materials add `AmbientLight` (intensity 5), `DirectionalLight`
   (3) and `HemisphereLight` (1.5), and never combine extreme
   `metalness`/`roughness` with no environment.
6. **Leave tone mapping alone.** R3L uses `NoToneMapping` on both backends so
   brightness matches; re-enabling ACES noticeably darkens the WebGPU output.
7. **Custom shaders use TSL** (`three/tsl`). Raw GLSL `ShaderMaterial` does not
   run on the WebGPU backend.
8. **Size through CSS.** Put the `Scene` in a sized parent and give it
   `width: 100%, height: 100%`; do not set pixel sizes inline.
9. **Large scenes:** `OrbitControls.maxDistance` is clamped to 90% of the
   camera far plane. Raise `camera.far` in `onCreated` for big models.
10. **Labels:** `Popup` and `Callout` render HTML through `CSS2DRenderer`; R3L
    already corrects the WebGPU Y axis, so do not counter-rotate them.
11. **One sun for the whole scene.** `SkyDome`, `Water`, `WaterPool` and
    `HeightFog` have no sun direction props. Set
    `globalParameterBus.set('sunDirection', new THREE.Vector3(x, y, z))` once;
    every effect reads and subscribes to it.

## Common tasks

| Task | Use |
| ---- | --- |
| Solid or image background | `<Scene bgColor="..." />`, `<Scene bgImage="..." />` |
| Load a GLTF/FBX/OBJ model | `<GLTFLoader modelUrl="/models/a.glb" />` |
| Model animation playback | `Animation` class |
| Auto-rotate a model | `ModelRotator` class |
| Hover / click picking | `Picker` class |
| HTML label anchored in 3D | `Popup` or `Callout` class |
| Draggable object | `Movable` class |
| Rain, snow, water, fog | `Rain`, `Snow`, `Water`, `WaterPool`, `HeightFog` components |
| Shared sun direction | `globalParameterBus.set('sunDirection', ...)` |
| Glow / post-processing | `Bloom` component, `GlowSprite` class |
| Sci-fi energy shield with impacts | `ForceShield` class (`hit()`, `setActive()`, `life`) |
| Maps and tiles | `GeoReference` + `TileLayer`, `GeoObject`, `GeoJsonLayer` |

## Look before you write

Each feature has a docs page with a props table and a runnable WebGPU/WebGL
demo. Read the page before using or changing a component — do not infer props
from the name.

- Scene: https://r3l.sunquakes.com/guide/scene
- Effects: `https://r3l.sunquakes.com/guide/effects/<name>` (e.g. `rain`,
  `snow`, `bloom`, `sky-dome`, `water`, `fireworks`, `global-parameters`)
- Global parameters:
  https://r3l.sunquakes.com/guide/effects/global-parameters
- Loaders: https://r3l.sunquakes.com/guide/model-loader-component
- Picking: https://r3l.sunquakes.com/guide/picking
- GIS: https://r3l.sunquakes.com/guide/gis/tile-layer

## Definition of done

- Renders under both `<Scene />` and `<Scene rendererType="webgl" />`.
- No console errors, no WebGPU/WebGL validation warnings.
- Resizes with its container.
- Every asset or instance created outside JSX is disposed on unmount.
- No duplicate animation loop: built-in motion is left to R3L.
