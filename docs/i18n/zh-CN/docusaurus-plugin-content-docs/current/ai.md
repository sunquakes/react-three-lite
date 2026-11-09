---
lang: zh-CN
title: AI 智能体
---

# 用 AI 智能体构建场景

`react-three-lite` 自带一个 **智能体技能（agent skill）**：一份说明文件，告诉
编码智能体如何用本库构建场景，而不是靠猜测 API。你只需要描述想要的场景，智能体会
读取技能、编写组件，并告诉你如何打开它。

## 技能包含什么

- `Scene` 的标准用法：渲染器、相机、控制器与逐帧回调
- 哪些功能是声明式组件，哪些是需要手动实例化的类
- WebGPU/WebGL 双渲染器一致、资源释放、纹理色彩空间与光照约定
- 每个功能对应文档页面的入口

## 安装

技能只需安装一次，放在用户主目录而不是项目目录，这样这台电脑上的所有项目都能使用。

选择你使用的智能体——每个智能体扫描的目录不同，各自有独立页面：

- [Claude Code](/zh-CN/guide/ai/claude-code) — `~/.claude/skills`
- [Codex CLI](/zh-CN/guide/ai/codex-cli) — `~/.codex/skills`
- [DeepSeek Harness](/zh-CN/guide/ai/deepseek-harness) — `~/.dsh/skills`
- [其他智能体](/zh-CN/guide/ai/others) — `~/.agents/skills`

## 使用它

现在用平常的话描述你想要的场景即可——不需要点名技能，智能体会自行判断是否适用。

```text
用 react-three-lite 给这个 React 应用加一个雨夜场景。告诉我你改了哪个文件、
怎么运行。
```

## 有效的提问方式

要求一个你能检查的结果，而不只是一个动作。

| 这样说 | 你应该看到 |
| ------ | ---------- |
| “用 react-three-lite 给这个 React 应用加一个全屏雨夜场景，告诉我改了哪个文件、怎么运行。” | 一个场景组件，以及开发服务器地址 |
| “把这个 GLB 模型放进场景，支持鼠标环绕，并自动适配视口。” | `Scene` 里的 `GLTFLoader`，相机通过 `FitCamera` 自动取景 |
| “只给第 1 层的物体加辉光。” | 一个 `<Bloom layer={1} />`，以及调用 `layers.set(1)` 的物体 |
| “让场景在 WebGPU 不可用时也能用，把两种渲染器都跑给我看。” | 默认 WebGPU 与 `rendererType="webgl"` 都能正常渲染 |
| “离开这个 3D 页面时内存泄漏了，找出没释放的资源并修复。” | 一份释放清单：几何体、材质、纹理、类实例 |

## 智能体必须遵守的规则

技能把以下要求设为硬性约束：

- 渲染器与动画循环由 `Scene` 管理，不手动调用 `setAnimationLoop`
- Three.js 一律使用命名空间导入 `import * as THREE from 'three'`
- 自带动画的功能保持原样，不写重复的逐帧更新代码
- JSX 之外创建的资源在卸载时全部释放
- WebGPU 与 WebGL 都要验证，参数以文档页面为准

## 验证结果

1. 打开开发服务器，确认场景正常渲染。
2. 把场景切换为 `rendererType="webgl"`，确认渲染效果一致。
3. 调整窗口大小，确认画布跟随容器变化。
4. 查看智能体列出的释放清单，它创建的每个实例都应出现在其中。

## 下一步

从 [Scene](/zh-CN/guide/scene) 页面开始，再按需添加[效果](/zh-CN/guide/effects/rain)、
模型加载和 GIS 相关功能。
