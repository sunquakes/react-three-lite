---
id: ai
lang: en-US
title: AI Agents
---

# Build with an AI Agent

`react-three-lite` ships an **agent skill**: a folder of instructions that tells
a coding agent how to build scenes with this library instead of guessing at the
API. You describe the scene you want; the agent reads the skill, writes the
component, and tells you how to open it.

## What the skill covers

- The `Scene` golden path: renderer, camera, controls and frame callbacks
- Which features are declarative components and which are imperative classes
- WebGPU/WebGL parity, resource cleanup, texture colour space and lighting
- Pointers to the exact docs page for every feature

## Install

The skill is installed once, in your home folder rather than a project folder, so
every project you open on this computer can use it.

Pick your agent — each one scans a different folder, and each has its own page:

- [Claude Code](/guide/ai/claude-code) — `~/.claude/skills`
- [Codex CLI](/guide/ai/codex-cli) — `~/.codex/skills`
- [DeepSeek Harness](/guide/ai/deepseek-harness) — `~/.dsh/skills`
- [Other agents](/guide/ai/others) — `~/.agents/skills`

## Use it

Now say what you want in plain language — you do not need to name the skill, the
agent works out that it applies.

```text
Add a rainy night scene to this React app using react-three-lite. Show me the
file you changed and how to run it.
```

## Prompts that work

Ask for a result you can check, not just an action.

| Say this | What you should see |
| -------- | ------------------- |
| "Add a full-screen rainy night scene to this React app using react-three-lite. Tell me the file you changed and how to run it." | one scene component, the dev-server address |
| "Show this GLB model in a scene with orbit controls, framed to fit the viewport." | a `GLTFLoader` inside `Scene`, camera fitted via `FitCamera` |
| "Add bloom to the objects on layer 1 only." | a `<Bloom layer={1} />` wired to objects that call `layers.set(1)` |
| "Make the scene work when WebGPU is unavailable. Show me both renderer variants." | `rendererType="webgl"` proven to render as well as the default |
| "This 3D view leaks when I navigate away. Find what is not disposed and fix it." | a cleanup list: geometries, materials, textures, class instances |

## What the agent follows

The skill makes these non-negotiable:

- `Scene` owns the renderer and animation loop; no manual `setAnimationLoop`
- namespace `import * as THREE from 'three'`, never named Three.js imports
- features that animate themselves are left alone — no duplicate per-frame code
- everything allocated outside JSX is disposed on unmount
- both WebGPU and WebGL are verified, with props taken from the docs page

## Verify the result

1. Open the dev server and confirm the scene renders.
2. Switch the scene to `rendererType="webgl"` and confirm it renders the same.
3. Resize the window and confirm the canvas follows its container.
4. Read the agent's list of disposed resources; every instance it created
   should appear there.

## Next

Start with the [Scene](/guide/scene) page, then add features from the
[Effect](/guide/effects/rain), loader and GIS sections.
