[English](https://github.com/sunquakes/react-three-lite/blob/main/README.md) | 🇨🇳中文

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

## 文档

访问 [r3l.sunquakes.com](https://r3l.sunquakes.com).

## 功能

- **Scene** — 核心 3D 场景容器，集成相机、渲染器、灯光和控制器
- **Model Loaders** — GLTF / FBX / OBJ 模型加载器，支持 Draco 压缩
- **Bloom** — 后处理辉光效果
- **Rain / Snow** — 基于 GLSL 着色器的粒子效果
- **SweepLight** — 模型扫描光线动画
- **LightGradient** — 动态光照渐变效果
- **Callout** — 引线注释，支持自动锚点跟随相机
- **ModelRotator** — 模型自动旋转工具
- **SkyBox** — 天空盒背景
- **Popup** — 3D 交互弹窗
- **Movable** — 可拖拽场景元素
- **Animation** — 模型动画播放
- **WaveCircleMesh / FlowLineMesh** — 自定义可视化网格

## 渲染器支持

react-three-lite 同时支持两种现代 3D 渲染器：

| 渲染器 | 默认 | 说明 |
|--------|------|------|
| **WebGPU** | ✅ | 来自 `three/webgpu` 的 `WebGPURenderer`，默认渲染器。当 WebGPU 不可用时会自动回退到 WebGL2 后端。 |
| **WebGL** | | 经典 `THREE.WebGLRenderer`，通过 `WebGLNodesHandler` 将 TSL 着色器编译为 GLSL。 |

通过 `rendererType` 属性按场景切换渲染器：

```jsx
import { Scene } from 'react-three-lite'

function App() {
  // WebGPU（默认）
  return <Scene style={{ width: '100%', height: '300px' }} />
}

function AppWebGL() {
  // WebGL
  return <Scene rendererType="webgl" style={{ width: '100%', height: '300px' }} />
}
```

文档站点上每个示例都通过 WebGPU / WebGL 标签页在两种渲染器下展示。

## 安装

### 安装 `Three.js`

```bash
pnpm i three
```

### 安装 `react-three-lite`

```bash
pnpm i react-three-lite
```

## 快速开始

- 在 `main.js` 中从 `react-three-lite` 导入所需的组件。

```jsx
import { Scene } from 'react-three-lite'

function App() {
  return <Scene style={{ width: '100%', height: '300px' }} />
}
```

## 证书

[Apache-2.0 license](/LICENSE)
