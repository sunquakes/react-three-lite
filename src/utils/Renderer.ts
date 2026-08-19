import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import type { R3LRenderer } from '../context/SceneContext'

export type RendererType = 'webgpu' | 'webgl'

/**
 * Creates a renderer instance of the requested type. Defaults to `webgpu`.
 *
 * - `webgpu`: `WebGPURenderer` from `three/webgpu`. It automatically falls back
 *   to the WebGL2 backend when WebGPU is not available, and all TSL shaders in
 *   this library compile to WGSL on WebGPU and GLSL on the WebGL backend.
 * - `webgl`: the classic `WebGLRenderer` from `three`.
 *
 * The returned renderer is NOT yet initialized. Call `await renderer.init()`
 * before rendering (WebGPURenderer only). When using the built-in Scene
 * component, init() is awaited automatically.
 */
export default function (type: RendererType = 'webgpu'): R3LRenderer {
  if (type === 'webgl') {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1.0
    return renderer as unknown as R3LRenderer
  }

  const renderer = new WebGPURenderer({
    antialias: true,
    alpha: true
  })
  renderer.toneMapping = THREE.NoToneMapping
  renderer.toneMappingExposure = 1.0
  return renderer as unknown as R3LRenderer
}
