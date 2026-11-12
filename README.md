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
- **Model Loaders** — `GLTFLoader` / `FBXLoader` / `OBJLoader` components and async function loaders with Draco compression support
- **Bloom** — Post-processing glow effect
- **HeightFog** — Screen-space exponential height fog
- **Fireworks** — Shader-driven firework launch with gravity-bent burst trails
- **TextFireworks** — Fireworks that assemble a text glyph from particles
- **Rain** — Particle rain that collides with height-mapped terrain and draws landing splashes
- **Snow** — Swirling snow that accumulates a snow shell on scene meshes
- **Water** — Cinematic shallow ocean with planar reflection and refraction, plus an optional irregular outline for lakes and shorelines
- **WaterPool** — Interactive ray-traced water pool you can ripple by dragging (water surface only; add `SkyDome` for the sky and sun)
- **SandyBeach** — Walkable dawn beach island with footprints in the sand
- **SkyBox** — Skybox background support
- **SkyDome** — Gradient sky dome with a low sun
- **Global Parameters** — Shared sun direction that keeps `SkyDome`, `Water`, `WaterPool` and `HeightFog` in sync
- **SweepLight** — Model sweep light animation
- **LightGradient** — Dynamic lighting gradient effect
- **LightPillar** — Vertical light pillar effect
- **RadarSweep** — Ground radar pulse ring
- **SignalWave** — Billboarded broadcast ping wave
- **GlowSprite** — Camera-facing halo sprite with optional pulse
- **NebulaGalaxy** — Particle nebula galaxy
- **ForceShield** — Hexagonal energy shield with impact rings and a dissolve animation
- **Callout** — Leader line annotation with auto-anchor camera tracking
- **Popup** — Interactive 3D popup dialogs
- **Movable** — Draggable scene elements
- **Animation** — Model animation playback
- **ModelRotator** — Automatic model rotation utility
- **Picker** — Hover and click picking for scene objects
- **FitCamera** — Coordinate-system agnostic camera framing
- **WaveCircleMesh / FlowLineMesh** — Custom visualization meshes
- **GeoObject** — Anchors an `Object3D` at a geographic coordinate
- **GeoJsonLayer** — Renders GeoJSON features as 3D geometry
- **TileLayer** — XYZ / slippy-map raster tile layer
- **GIS helpers** — GeoReference, datum conversion (WGS84 / GCJ-02 / BD-09) and tile selection utilities

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
