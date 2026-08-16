## [0.4.0] - 2026-08-11

### Added

- Add Callout annotation component with leader line (straight/broken shapes), anchor dot, React-rendered label, and `autoAnchor` mode that slides the connection point along the label's bottom edge based on camera direction.
- Add ModelRotator utility class for automatic model rotation with configurable speed, axis, and easing.
- Add LightGradient effect class for dynamic lighting gradient animation with `dispose()` method.
- Add Callout documentation with examples in English and Chinese.
- Add ModelRotator documentation with examples in English and Chinese.
- Add LightGradient documentation with examples in English and Chinese.
- Add Three.js namespace import convention guidelines to AGENTS.md.
- Add unified demo scene background color standard (`#1a1a2e`) to AGENTS.md.

### Changed

- Unify Three.js import convention to namespace import (`import * as THREE from 'three'`) across all source files.
- Migrate ESLint configuration from `.eslintrc.cjs` to flat config `eslint.config.js`.
- Unify all documentation example scene background colors to `#1a1a2e`.
- Refactor documentation component naming: remove `Component` suffix, unify to `App` naming format.
- Refactor mesh resource cleanup logic with stricter type-safe handling.
- Update dependency versions (@types/react, @types/three, eslint, etc.).

### Fixed

- Fix mesh material attribute cleanup and dispose calls with proper type assertions.

---

## [0.3.0] - 2026-06-06

### Added

- Add SweepLight effect component for model sweep light animation.
- Add sweep light configuration options (color, speed, width, intensity, direction, loop).
- Add sweep light methods (play, pause, stop, dispose).
- Add sweep light documentation with examples in English and Chinese.

### Changed

- Update SweepLight document examples and configuration items.
- Fix the usage example code of SweepLight in the documentation.
- Add `id` field to English documentation frontmatter for Docusaurus compatibility.
- Update Scene container style in documentation examples with consistent dimensions.
- Refactor Methods section in documentation to use table format.

---

## [0.2.0] - 2026-05-30

### Added

- Add Rain Drop effect component with configurable parameters (count, speed, color).
- Add Snowflake Particle effect component with customizable settings.
- Add Draco compression model loading support via DRACOLoader integration.
- Add `useDraco` and `dracoDecoderPath` props for GLTF/FBX/OBJ loaders.

### Changed

- Improve resource cleanup logic for rain, snow, loaders, and Bloom components.
- Refactor `addBeforeFrame`/`addAfterFrame` to return deregistration functions.
- Fix frame callback leakage issues and memory release process.
- Update documentation site configuration with SEO optimization and last update time display.
- Optimize CI workflow to inject version number from package.json into documentation.
- Update document URLs, badges, and dynamic version fetch logic.
- Flatten zh-CN docs directory structure to match Docusaurus conventions.
- Improve Chinese translations for flow-line, popup, and scene documentation.
- Add `gridHelper` prop documentation for Scene component.
- Adjust raindrop vertex shader parameters and default colors.
- Optimize scene background color and particle default parameters.

### Fixed

- Fix window resize dimension retrieval logic.
- Fix Scene component and utility class resource destruction for complete memory release.

---

## [0.1.0] - 2026-05-30

### Added

- Add Scene component for 3D scene rendering.
- Add SkyBox component for skybox background.
- Add GLTFLoader component and function for loading GLTF models.
- Add FBXLoader component and function for loading FBX models.
- Add OBJLoader component and function for loading OBJ models.
- Add Popup component for interactive popup dialogs.
- Add MovableElement component for draggable elements.
- Add Animation component for model animation playback.
- Add WaveCircleMesh class for wave circle mesh visualization.
- Add FlowLineMesh class for animated flow line visualization.
- Add Bloom effect component for glow post-processing.
- Add grid helper and axes helper support.
- Add background color and background image support.
- Add comprehensive documentation with Chinese and English translations.
