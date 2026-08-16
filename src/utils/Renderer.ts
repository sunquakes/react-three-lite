import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'

/**
 * Creates a renderer instance. Defaults to `WebGPURenderer`.
 *
 * WebGPURenderer automatically falls back to WebGL2 when WebGPU is not
 * available. All shaders in this library are written in TSL (Three Shader
 * Language) which compiles to WGSL for WebGPU and GLSL for WebGL, so
 * effects work identically on both backends.
 *
 * The returned renderer is NOT yet initialized. Call `await renderer.init()`
 * before rendering. When using the built-in Scene component, init() is
 * awaited automatically.
 */
export default function (): WebGPURenderer {
  const renderer = new WebGPURenderer({
    antialias: true,
    alpha: true
  })
  renderer.toneMapping = THREE.NoToneMapping
  renderer.toneMappingExposure = 1.0
  return renderer
}
