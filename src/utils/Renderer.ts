import * as THREE from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { WebGLNodesHandler } from 'three/examples/jsm/tsl/WebGLNodesHandler.js'
import type { R3LRenderer } from '../context/SceneContext'

export type RendererType = 'webgpu' | 'webgl'

/**
 * Enables three's GPU-driven meshlet pipeline on a `WebGPURenderer`.
 *
 * `MeshletDrawingPipeline` ships with three r187; it splits geometries into
 * clusters, builds a chain of simplified levels of detail and culls them on the
 * GPU, so hidden clusters are skipped and distant objects switch to a cheaper
 * mesh. Objects and materials it cannot handle are drawn by the regular
 * pipeline, and the WebGL backend ignores it entirely.
 *
 * The module is imported lazily and failures are swallowed: the library still
 * advertises `three >= 0.180`, and on older releases (or in a WebGL fallback)
 * the standard drawing pipeline stays in place.
 */
function enableMeshletPipeline(renderer: R3LRenderer): void {
  // `drawingPipeline` only exists in three r186+, so it is accessed through a
  // structural type to stay compatible with the minimum supported version.
  const target = renderer as R3LRenderer & { drawingPipeline?: unknown }
  // Captured before the async import resolves: if the caller replaced the
  // pipeline in the meantime (e.g. from onCreated), keep their choice.
  const standardPipeline = target.drawingPipeline
  void import('three/addons/pipelines/MeshletDrawingPipeline.js')
    .then(({ MeshletDrawingPipeline }) => {
      if (target.drawingPipeline !== standardPipeline) return

      /**
       * r187 added `Object3D.intersectsFrustum`, and the pipeline relies on it
       * while a geometry has no clusters yet. Objects created by another copy
       * of three (e.g. mixed versions in one app) do not implement it, so they
       * are kept in the regular pipeline instead of throwing.
       */
      class CompatibleMeshletDrawingPipeline extends MeshletDrawingPipeline {
        isCulled(object: { intersectsFrustum?: unknown }, camera: unknown): boolean {
          if (typeof object.intersectsFrustum !== 'function') return false
          return super.isCulled(object, camera)
        }
      }

      target.drawingPipeline = new CompatibleMeshletDrawingPipeline({
        // Allowed screen-space error in pixels: larger values trade detail for
        // speed. 1.5 matches the official city example.
        lodThreshold: 1.5,
        occlusionCulling: true
      })
    })
    .catch(() => {
      // Older three versions do not ship the module; keep the standard pipeline.
    })
}

/**
 * Creates a renderer instance of the requested type. Defaults to `webgpu`.
 *
 * - `webgpu`: `WebGPURenderer` from `three/webgpu`. It automatically falls back
 *   to the WebGL2 backend when WebGPU is not available, and all TSL shaders in
 *   this library compile to WGSL on WebGPU and GLSL on the WebGL backend.
 * - `webgl`: the classic `THREE.WebGLRenderer`. The library is built entirely
 *   on three.js TSL (NodeMaterial, RenderPipeline, etc.); a plain
 *   `WebGLRenderer` cannot compile TSL shaders because it has no node builder,
 *   so we attach three's official `WebGLNodesHandler`, which bridges the node
 *   system into `WebGLRenderer` (TSL compiles to GLSL and runs on a genuine
 *   WebGL context, `data-engine="three.js r184"`).
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
    // WebGLNodesHandler compiles TSL node materials to GLSL for WebGLRenderer.
    // WebGLRenderer.render() invokes renderStart/renderEnd/build automatically
    // once the handler is attached via setNodesHandler().
    const nodesHandler = new WebGLNodesHandler()
    nodesHandler.setRenderer(renderer)
    renderer.setNodesHandler(nodesHandler)
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
  const r3lRenderer = renderer as unknown as R3LRenderer
  enableMeshletPipeline(r3lRenderer)
  return r3lRenderer
}
