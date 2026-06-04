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
