English | [🇨🇳中文](https://github.com/sunquakes/react-three-lite/blob/main/README_ZH.md)

# React Three Lite

<p align="center">
  <a href="https://r3l.sunquakes.com/" target="_blank" rel="noopener noreferrer">
    <img width="200" src="https://r3l.sunquakes.com/images/logo.png" alt="react-three-lite logo">
  </a>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/node-%3E=18.20.6-brightgreen.svg?maxAge=2592000" alt="Node">
  <img alt="GitHub" src="https://img.shields.io/github/license/sunquakes/react-three-lite?color=blue">
  <img alt="react-three-lite" src="https://img.shields.io/github/v/release/sunquakes/react-three-lite">
</p>

## Documentation

Visit [r3l.sunquakes.com](https://r3l.sunquakes.com).

## Features

- **Scene** — Core 3D scene container with camera, renderer, lights, and controls
- **Model Loaders** — GLTF / FBX / OBJ loaders with Draco compression support
- **Bloom** — Post-processing glow effect
- **Rain / Snow** — Particle effects with custom GLSL shaders
- **SweepLight** — Model sweep light animation
- **LightGradient** — Dynamic lighting gradient effect
- **Callout** — Leader line annotation with auto-anchor camera tracking
- **ModelRotator** — Automatic model rotation utility
- **SkyBox** — Skybox background support
- **Popup** — Interactive 3D popup dialogs
- **Movable** — Draggable scene elements
- **Animation** — Model animation playback
- **WaveCircleMesh / FlowLineMesh** — Custom visualization meshes

## Renderer Support

react-three-lite works with both modern 3D renderers:

| Renderer | Default | Notes |
|----------|---------|-------|
| **WebGPU** | ✅ | `WebGPURenderer` from `three/webgpu`. The default renderer. Automatically falls back to the WebGL2 backend when WebGPU is unavailable. |
| **WebGL** | | Classic `THREE.WebGLRenderer`. TSL shaders are compiled to GLSL via `WebGLNodesHandler`. |

Switch renderers per scene with the `rendererType` prop:

```jsx
import { Scene } from 'react-three-lite'

function App() {
  // WebGPU (default)
  return <Scene style={{ width: '100%', height: '300px' }} />
}

function AppWebGL() {
  // WebGL
  return <Scene rendererType="webgl" style={{ width: '100%', height: '300px' }} />
}
```

The docs site shows every example under both renderers with a WebGPU / WebGL tab switch.

## Install

### Install `Three.js`

```bash
pnpm i three
```

### Install `react-three-lite`

```bash
pnpm i react-three-lite
```

## Getting Started

- Import the desired components from `react-three-lite` in `main.js`.

```jsx
import { Scene } from 'react-three-lite'

function App() {
  return <Scene style={{ width: '100%', height: '300px' }} />
}
```

## License

[Apache-2.0 license](/LICENSE)
