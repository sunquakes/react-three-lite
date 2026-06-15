# React Three Lite - Agent Guidelines

## Project Overview

React Three Lite (R3L) is a lightweight React component library built on Three.js for seamless 3D web experiences.

- **Repository**: https://github.com/sunquakes/react-three-lite
- **Documentation**: https://r3l.sunquakes.com
- **License**: Apache-2.0

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **3D Engine**: Three.js (>=0.172.0)
- **Build Tool**: Vite
- **Testing**: Vitest
- **Package Manager**: pnpm (preferred)

## Project Structure

```
src/
├── components/          # React components
│   ├── Scene.tsx        # Core 3D scene container
│   ├── Bloom.tsx        # Post-processing bloom effect
│   ├── Rain.tsx         # Rain particle effect
│   ├── Snow.tsx         # Snow particle effect
│   ├── GLTFLoader.tsx   # GLTF model loader component
│   ├── FBXLoader.tsx    # FBX model loader component
│   └── OBJLoader.tsx    # OBJ model loader component
├── context/
│   └── SceneContext.tsx # React context for scene sharing
├── meshes/              # Custom 3D mesh classes
│   ├── WaveCircleMesh.ts
│   └── FlowLineMesh.ts
├── utils/               # Utility classes and functions
│   ├── Camera.ts        # Camera setup
│   ├── Light.ts         # Lighting setup
│   ├── Renderer.ts      # WebGL renderer
│   ├── Scene.ts         # Scene initialization
│   ├── SkyBox.ts        # Skybox implementation
│   ├── Popup.ts         # 3D popup positioning
│   ├── Movable.ts       # Movable element controller
│   ├── Animation.ts     # Animation controller
│   ├── Controls.ts      # OrbitControls setup
│   ├── ModelLoader.ts   # Async model loaders
│   └── UUID.ts          # UUID generation
├── enums/
│   └── AxisType.ts
└── index.ts             # Public API exports
```

## Key Components

### Scene
The core component that initializes and manages the Three.js scene, camera, renderer, lights, and controls.

### Rain / Snow
Particle effects using custom GLSL shaders with `Points` and `ShaderMaterial`:
- **Rain**: Vertical streaks with wind distortion
- **Snow**: Hexagonal snowflakes with swaying motion, uses Canvas-generated texture

### Model Loaders
Components for loading 3D models (GLTF, FBX, OBJ) with caching support via IndexedDB.

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Use functional components with hooks
- Follow existing naming conventions (PascalCase for components, camelCase for utilities)

### Three.js Import Convention
**ALWAYS use namespace import for Three.js**: `import * as THREE from 'three'`

- **DO NOT** use named imports like `import { Scene, WebGLRenderer } from 'three'`
- **DO NOT** mix named imports with namespace imports
- Access types via `THREE.` prefix (e.g., `THREE.Scene`, `THREE.WebGLRenderer`, `THREE.Object3D`)
- This ensures consistency across all files and avoids duplicate imports

**Good:**
```ts
import * as THREE from 'three'

const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
```

**Bad:**
```ts
import { Scene, WebGLRenderer } from 'three'
import * as THREE from 'three'  // Don't mix both
```

### Adding New Components
1. Create component in `src/components/`
2. Export from `src/index.ts`
3. Add documentation in `docs/guide/`
4. Add demo component in `docs/src/components/`
5. Update `docs/sidebars.js`
6. Add i18n labels in `docs/i18n/*/docusaurus-plugin-content-docs/current.json`

**Resource Cleanup on Unmount**: When adding new components, meshes, utilities, or any feature that allocates Three.js resources (geometries, materials, textures, shaders, event listeners, animation frames, etc.), you MUST implement proper cleanup in the `useEffect` return function to prevent memory leaks:

```tsx
useEffect(() => {
  // Initialize resources
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.ShaderMaterial({ ... })
  const mesh = new THREE.Points(geometry, material)
  scene.add(mesh)

  // Cleanup on unmount
  return () => {
    scene.remove(mesh)
    geometry.dispose()
    material.dispose()
    // Dispose textures, cancel animation frames, remove event listeners, etc.
  }
}, [])
```

**Note on Demo Components**: When creating demo components for visual effects:
- Use `export default function App()` format (not arrow functions)
- Import from `react-three-lite` directly (not relative paths like `../../..`)
- Import THREE: `import * as THREE from 'three'` (not `import type`, needs runtime access)
- Use `onCreated` callback on `<Scene>` to initialize effects (not `useScene()` hook)
- Set camera position in `handleCreated`: `camera.position.set(0, 0, 4)`
- Use `camera.lookAt(0, 0, 0)` to ensure proper orientation
- Set demo container style: `style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}`
- Add cleanup in `useEffect` return function and set refs to `null`
- Use `// Cleanup on unmount` comment before useEffect

**Note on Documentation Code Examples**: 
- Use `function App()` for code examples in documentation (NOT `XxxComponent`)
- Import demo components in docs using the feature name WITHOUT `Component` suffix (e.g., `import SkyBox from '@site/src/components/SkyBox'`, NOT `import SkyBoxComponent`)
- For multiple demos in one doc, use `App`, `AppOptions`, `AppCustom`, etc.
- The JSX usage tag should match the import name (e.g., `<SkyBox />`, `<App />`)

Example structure:
```tsx
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, YourEffect } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App() {
  const effectRef = useRef<YourEffect | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    effectRef.current = new YourEffect(...)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      effectRef.current?.dispose()
      effectRef.current = null
    }
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

### Shader Development
- Use `ShaderMaterial` with custom vertex/fragment shaders
- Pass time-based animation via `uTime` uniform
- Use `AdditiveBlending` for particle effects
- Set `transparent: true` and `depthWrite: false`

### Particle Effect Development Workflow
When creating particle effects like Rain or Snow, follow this workflow:

**1. Create Base Component**
- Copy existing particle component (Rain or Snow) as template
- Rename and adjust props interface

**2. Implement Vertex Shader**
- Set up time-based position animation
- Configure `gl_PointSize` with distance attenuation
- Pass varyings to fragment shader

**3. Implement Fragment Shader**
- Choose shape approach:
  - Procedural: distance fields with `gl_PointCoord`
  - Texture-based: `sampler2D` with generated texture
- Apply opacity and alpha discard

**4. Generate Texture (if needed)**
- Create canvas element
- Draw shape with 2D API
- Convert to `CanvasTexture`
- Pass as uniform

**5. Create Demo Component**
- Set front-facing camera: `camera.position.set(0, 0, 4)`
- Use `camera.lookAt(0, 0, 0)` to ensure proper orientation
- Choose contrasting background color
- Adjust camera distance for visibility
- Set demo container style: `style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}`

**6. Iterative Visual Tuning**
- Adjust shape in fragment shader
- Tune size in vertex shader
- Refine colors and opacity
- Verify against demo with contrasting background

**7. Add Documentation**
- Write English guide page in `docs/guide/`
- Write Chinese guide page in `docs/i18n/zh-CN/docusaurus-plugin-content-docs/current/`
- Update sidebar and i18n labels

> **Note**: Steps 5 and 7 are required for all new features (components, meshes, utilities, etc.), not just particle effects.

### Testing
```bash
pnpm test:unit    # Run unit tests
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
```

### Building
```bash
pnpm build        # Build for production
```

## Common Patterns

### Scene Context Usage
Components inside `<Scene>` can access the Three.js scene via `useScene()` hook:

```tsx
import { useScene } from 'react-three-lite'

const MyComponent = () => {
  const { scene, sceneComponents, addBeforeFrame } = useScene()
  // Access scene, camera, renderer, etc.
}
```

### Adding Frame Callbacks
Use `addBeforeFrame` for per-frame updates:

```tsx
const animate = () => {
  // Update uniforms, positions, etc.
}

useEffect(() => {
  addBeforeFrame?.(animate)
}, [])
```

### Iterative Visual Tuning Workflow
When fine-tuning visual effects, expect multiple iteration cycles between these steps:

1. **Shape adjustment** -> 2. **Size tuning** -> 3. **Color refinement** -> 4. **Camera positioning** -> 5. **Visual verification**

Repeat until visual effect meets requirements.

## Documentation Structure

```
docs/
├── guide/                    # English documentation
│   ├── effects/
│   │   ├── bloom.md
│   │   ├── rain.md
│   │   └── snow.md
│   ├── meshes/
│   └── ...
├── i18n/zh-CN/docusaurus-plugin-content-docs/current/  # Chinese documentation
│   ├── effects/              # Note: NOT under guide/
│   │   ├── bloom.md
│   │   ├── rain.md
│   │   └── snow.md
│   ├── meshes/
│   └── ...
└── src/components/           # Demo components
    └── effects/
        ├── Rain.tsx
        └── Snow.tsx
```

**Important**: Chinese docs for effects are placed directly under `current/effects/`, not `current/guide/effects/`.

Run docs locally:
```bash
cd docs
pnpm start
```

## Documentation Format

All documentation pages MUST follow this structure:

### English Docs (`docs/guide/`)

```markdown
---
id: <component-name>
lang: en-US
title: <Component Name>
---

import <ComponentName> from '@site/src/components/<ComponentName>'

## Type

<Component | Class>

## Default Usage

<<ComponentName> />

```tsx
import { Scene, <ComponentName> } from 'react-three-lite'
import { useRef, useEffect } from 'react'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

function <ComponentName>Component() {
  const effectRef = useRef<...>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    // Initialize effect here
  }

  useEffect(() => {
    return () => {
      effectRef.current?.dispose()
      effectRef.current = null
    }
  }, [])

  return (
    <Scene bgColor="#0a0a0a" style={{ marginTop: '10px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
```

## Options (if applicable)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| name | type | default | Description |

## Props (for components)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| name | type | default | Description |

## Methods (for classes)

| Name | Parameters | Description |
|------|------------|-------------|
| constructor | (param1: type, param2?: type) => void | Constructor description |
| methodName | (param: type) => returnType | Method description |

## Events (for components)

| Name | Parameters | Description |
|------|------------|-------------|
| onEvent | (params) => void | Description |
```

### Chinese Docs (`docs/i18n/zh-CN/docusaurus-plugin-content-docs/current/`)

```markdown
---
lang: zh-CN
title: <组件名称>
---

import <ComponentName> from '@site/src/components/<ComponentName>'

## 类型

<组件 | 类>

## 默认用法

<<ComponentName> />

```tsx
// same code as English version
```

## 配置项（如适用）

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| name | type | default | 描述 |

## 方法（如适用）

| 名称 | 参数 | 描述 |
|------|------|------|
| constructor | (param1: type, param2?: type) => void | 构造函数描述 |
| methodName | (param: type) => returnType | 方法描述 |
```

### Key Rules
- English docs use `id`, `lang: en-US`, and `title` in frontmatter
- Chinese docs use only `lang: zh-CN` and `title` (no `id`)
- Always import demo component with `@site/src/components/` alias
- Code examples should use `style={{ marginTop: '10px', width: '100%', height: '300px' }}` for Scene containers
- Options/Props tables use consistent column names
- Chinese docs for effects go under `current/effects/`, not `current/guide/effects/`
