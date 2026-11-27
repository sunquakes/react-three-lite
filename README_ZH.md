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
- **Model Loaders** — `GLTFLoader` / `FBXLoader` / `OBJLoader` 组件与异步函数加载器，支持 Draco 压缩
- **Bloom** — 后处理辉光效果
- **HeightFog** — 屏幕空间指数高度雾
- **Fireworks** — 基于着色器的烟花升空与重力弯曲拖尾
- **TextFireworks** — 烟花汇聚成文字的粒子效果
- **Rain** — 粒子降雨，会在高度图地形上碰撞并绘制落地溅落涟漪
- **Snow** — 飘雪粒子，可在场景物体表面逐渐堆积出雪层
- **Water** — 电影级浅海效果，支持平面反射与折射，可通过不规则轮廓裁出湖泊与海岸线
- **WaterPool** — 可拖拽产生涟漪的交互式光线追踪水池（只绘制水面，天空与太阳请搭配 `SkyDome`）
- **SandyBeach** — 可行走的黎明沙滩岛屿，沙面留下脚印
- **SkyBox** — 天空盒背景
- **SkyDome** — 带低角度太阳的渐变天穹
- **全局参数** — 共享太阳方向，让 `SkyDome`、`Water`、`WaterPool` 与 `HeightFog` 保持一致
- **SweepLight** — 模型扫描光线动画
- **LightGradient** — 动态光照渐变效果
- **LightPillar** — 垂直光柱效果
- **RadarSweep** — 地面雷达脉冲环
- **SignalWave** — 面向相机的广播信号波
- **GlowSprite** — 面向相机的光晕精灵，可自动脉动
- **NebulaGalaxy** — 粒子星云星系
- **ForceShield** — 六边形能量护盾，带命中扩散环与溶解动画
- **Callout** — 引线注释，支持自动锚点跟随相机
- **Popup** — 3D 交互弹窗
- **Movable** — 可拖拽场景元素
- **Animation** — 模型动画播放
- **ModelRotator** — 模型自动旋转工具
- **Picker** — 场景物体的悬停与点击拾取
- **FitCamera** — 与坐标系无关的相机取景工具
- **WaveCircleMesh / FlowLineMesh** — 自定义可视化网格
- **GeoObject** — 将 `Object3D` 锚定到地理坐标
- **GeoJsonLayer** — 将 GeoJSON 要素渲染为 3D 几何体
- **TileLayer** — XYZ / 瓦片地图栅格图层
- **GIS helpers** — GeoReference、基准转换（WGS84 / GCJ-02 / BD-09）与瓦片选取工具

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
