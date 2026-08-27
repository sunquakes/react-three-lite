## [0.5.0] - 2026-08-27

This release migrates the library from a WebGL-only implementation to a dual-renderer architecture built on Three.js TSL, with `WebGPURenderer` as the new default.

### Breaking Changes

- Default to `WebGPURenderer` from `three/webgpu` instead of `THREE.WebGLRenderer`. Set `rendererType="webgl"` on `<Scene>` to keep the previous backend. Renderer creation is now asynchronous, because `WebGPURenderer` requires `await renderer.init()` before its first frame.
- Rewrite every shader with TSL (`three/tsl`) and `NodeMaterial`, replacing the previous `ShaderMaterial` and raw GLSL implementations. Shader code passed into Rain, Snow, SweepLight, WaveCircleMesh or FlowLineMesh from outside the library no longer applies.
- Replace `WebGLRenderer` with the `R3LRenderer` type across the public surface, including the `renderer` prop of `<Scene>`, the `renderer` value on the scene context, and the `renderer` argument of the `onFrame` / `onBeforeFrame` / `onAfterFrame` callbacks. `R3LRenderer` covers both backends.
- Change the default light from a single `AmbientLight` to a `THREE.Group` holding an `AmbientLight` plus a `DirectionalLight`, required for PBR materials to show surface detail. The `light` prop and `sceneComponents.light` are therefore typed as `THREE.Object3D` rather than `THREE.Light`. `LightGradient` accepts both a single light and a group.
- Publish ESM only: drop the UMD build and the `require` entry from `exports`. three has not shipped a UMD bundle since r160, so the `THREE` global the UMD output depended on never existed at runtime.
- Raise the `three` peer dependency from `>=0.172.0` to `>=0.180.0`, matching the WebGPU renderer and TSL APIs actually used by the library.

### Added

- Add a `rendererType` prop to `<Scene>`, accepting `'webgpu'` (default) or `'webgl'`. The WebGL path attaches three's official `WebGLNodesHandler` so TSL shaders compile to GLSL and run on a genuine WebGL context.
- Export the `RendererType` and `R3LRenderer` types.
- Expose the active renderer as `scene.userData.renderer`, so custom meshes added to a scene can detect the backend at runtime and adapt to rendering differences.
- Add a default PBR environment: the scene now generates an IBL environment map through `PMREMGenerator` so `MeshStandardMaterial` and `MeshPhysicalMaterial` are lit without an explicit skybox.
- Add material normalization to the model loaders: tag base color and emissive textures as sRGB, clamp fully mirror-like metal/roughness combinations, and upgrade legacy `MeshLambertMaterial` / `MeshPhongMaterial` to `MeshStandardMaterial` so they receive environment lighting.
- Add normal smoothing for loaded models: re-weld shared vertices and recompute vertex normals for geometry that arrives with faceted or missing normals, so curved surfaces such as cylinders render smoothly.
- Add `disposeModel()` and `disposeDRACOLoader()` helpers to release model GPU resources and terminate the shared DRACO worker pool.
- Add `SkyBox.dispose()` to release the skybox cube render target.
- Add dual-renderer WebGPU / WebGL tabs to every example in the English and Chinese documentation.
- Add FBX debugging scripts for inspecting raw nodes, materials and textures.
- Add the first unit test suite, covering resource disposal, the WebGPU and WebGL color correction paths, Movable and ModelRotator timing math, Animation clip handling and UUID generation.
- Add a public API surface guard test that fails whenever an export is added, removed or renamed, so the API cannot drift silently before it is frozen at 1.0.0.
- Add a `test` script for single-run test execution in CI, and a `typecheck` script for standalone type checking.

### Changed

- Import Three.js from `three/webgpu` where class identity matters. `three` and `three/webgpu` are separate builds with distinct class identities, so lights constructed from `three` were never matched by `LightsNode.setupNodeLights` and silently had no effect on rendering.
- Rebuild the Rain and Snow particle systems on indexed quad geometry with clip-space billboarding, replacing `Points` and `gl_PointSize`, which has no TSL equivalent that behaves identically on both backends.
- Apply WebGPU color pre-correction in Rain, Snow, SweepLight, WaveCircleMesh and FlowLineMesh. Custom TSL materials pass through a linear-to-sRGB conversion on the WebGPU output that WebGL does not perform, so colors are corrected up front to keep both backends visually identical.
- Render bloom through `RenderPipeline` and the TSL `bloom()` node on WebGPU, while keeping `EffectComposer` with `UnrealBloomPass` on WebGL.
- Tune the default lighting for PBR: add a `HemisphereLight` for sky and ground bounce, and keep the ambient intensity low so PBR surfaces are not blown out now that an environment map also contributes light.
- Load model textures through a dedicated `LoadingManager` and resolve the loader promise only once every texture request has settled. `TextureLoader.load()` inside `MTLLoader` and `FBXLoader` is fire-and-forget, so inspecting textures right after parsing revealed nothing about their state.
- Deduplicate the identical cleanup logic in the GLTF, FBX and OBJ loader components into the shared `disposeModel()` helper.
- Exclude test files from the generated type declarations so they never reach the published package.
- Declare `pnpm` as the package manager and correct the `repository` URL format in `package.json`.

### Fixed

- Fix CSS2D labels rendering vertically mirrored on WebGPU. `WebGPURenderer` flips the clip-space Y axis, which invalidates the WebGL-based element placement formula in the upstream `CSS2DRenderer`, so label positions are now recomputed for the WebGPU coordinate system.
- Fix models rendering untextured on WebGPU. The backend binds a placeholder for textures whose image has not decoded yet and then skips further uploads while the version is unchanged, so texture versions are now bumped once the images arrive.
- Fix texture flicker on the first rendered frame after a model finishes loading.
- Fix FBX models appearing too dark by using white as the base color when a material carries a texture.
- Fix OBJ models rendering as a black screen by waiting for all textures before resolving, matching the FBX loader, and fix the OBJ loader mixing geometry with wireframe output.
- Fix `PMREMGenerator` selection: the node-based generator in `three/webgpu` requires `renderer.hasInitialized()`, which only `WebGPURenderer` provides, so the legacy generator from `three` is used on WebGL.
- Fix bloom failing to render when the container has a zero size during initial layout, by observing container resizes and updating the post-processing composer.
- Fix the camera aspect ratio becoming `Infinity` or `NaN` for a scene mounted inside a zero-size container, such as a hidden tab.
- Fix visible gaps and dark seams in the FlowLineMesh arrow texture by disabling mipmaps, switching to nearest filtering and blending two samples across the UV wrap seam.
- Externalize three subpath imports (`three/webgpu`, `three/tsl`, `three/addons/*`, `three/examples/jsm/*`) and `three-stdlib`. They were previously bundled, shipping a second copy of three and breaking class identity checks such as `LightsNode` failing to recognize light instances.
- Dispose material textures when unloading models. Only geometries and materials were released before, leaking the dominant share of a model's VRAM.
- Fix the arrow texture leak in FlowLineMesh.
- Remove the `'added'` event listener and detach from the parent in `WaveCircleMesh.dispose()` and `FlowLineMesh.dispose()`.
- Fix the skybox rendering black on WebGPU by tagging the cube texture as `SRGBColorSpace`.
- Fix `release:patch` / `release:minor` / `release:major`, which always failed because the version argument was validated against a strict semver pattern that rejected the bump keywords.
- Declare Node globals for `scripts/` and config files in the ESLint config, fixing 45 spurious `no-undef` errors that left `pnpm lint` permanently failing.

---

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
