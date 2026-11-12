/**
 * Minimal typings for optional three addons that are newer than the minimum
 * supported three version (`>= 0.180`).
 */

/**
 * Ships with three r187+. The library imports it lazily, so the types cannot be
 * taken from `@types/three` at build time.
 */
declare module 'three/addons/pipelines/MeshletDrawingPipeline.js' {
  export class MeshletDrawingPipeline {
    constructor(parameters?: {
      lodThreshold?: number
      occlusionCulling?: boolean
      debug?: boolean
    })
    isCulled(object: { intersectsFrustum?: unknown }, camera: unknown): boolean
  }
}
