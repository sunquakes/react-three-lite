import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  reflector,
  screenUV,
  sRGBTransferOETF,
  texture,
  uniform,
  viewportSafeUV,
  viewportSharedTexture
} from 'three/tsl'
import { type Node } from 'three/webgpu'
import { useScene } from '../context/SceneContext'
import { createWaterMaterial, type WaterMaterialSamplers } from '../utils/WaterMaterial'
import { createNoiseTexture } from '../utils/WaterNoise'
import { updateMirrorCamera } from '../utils/WaterReflection'
import { sampleOceanSurface } from '../utils/WaterSpectrum'
import { globalParameterBus } from '../utils/ParameterBus'

export interface WaterProps {
  /** Longest edge of the planar captures, in device pixels. */
  captureResolution?: number
  /** Plane subdivisions per axis. */
  segments?: number
  /** Size of the water patch, in world units. */
  size?: number
  /** World position of the water surface centre. Defaults to [0, 0, 0]. */
  position?: THREE.Vector3 | [number, number, number]
}

// Captures are sized relative to the drawing buffer and clamped to keep the
// cost bounded on very large and very small canvases.
const MIN_CAPTURE_SCALE = 0.14
const MAX_CAPTURE_SCALE = 0.42
// While the camera is well below the surface the captures are not visible, so
// they are skipped and the previous results are reused.
const UNDERWATER_CAPTURE_SKIP = 0.65
const UNDERWATER_EASING = 0.085

/**
 * Cinematic shallow ocean surface.
 *
 * Renders a displaced plane driven by a 14 wave directional spectrum that is
 * shared with the CPU sampler used for the underwater test. Shading includes
 * Fresnel reflectance, GGX sun glitter, foam, depth based water colors and
 * planar reflection / refraction of the surrounding scene.
 *
 * Both renderers are supported: WebGPU uses the reflector and viewport shared
 * texture nodes, while the classic WebGL renderer renders the two planar
 * captures into half float render targets on the CPU side.
 */
const Water = ({
  captureResolution = 512,
  segments = 240,
  size = 420,
  position = [0, 0, 0]
}: WaterProps) => {
  const sceneContext = useScene()
  const animationIdRef = useRef<number | null>(null)

  const [positionX, positionY, positionZ] = Array.isArray(position)
    ? position
    : [position.x, position.y, position.z]

  useEffect(() => {
    const { renderer, scene, sceneComponents, container } = sceneContext
    if (!renderer || !scene || !sceneComponents?.camera) {
      return
    }

    const camera = sceneComponents.camera
    const isWebGPU = renderer.isWebGPURenderer === true
    const sunVector = globalParameterBus.get('sunDirection').clone().normalize()

    const noiseTexture = createNoiseTexture()
    const uTime = uniform(0)
    const uUnderwater = uniform(0)
    const uSunDirection = uniform(sunVector)

    const unsubscribeSunDirection = globalParameterBus.subscribe('sunDirection', (direction) => {
      uSunDirection.value.copy(direction).normalize()
    })

    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    const drawingSize = new THREE.Vector2()

    const computeCaptureScale = () => {
      renderer.getDrawingBufferSize(drawingSize)
      return THREE.MathUtils.clamp(
        captureResolution / Math.max(drawingSize.width, drawingSize.height, 1),
        MIN_CAPTURE_SCALE,
        MAX_CAPTURE_SCALE
      )
    }

    const computeCaptureSize = () => {
      const scale = computeCaptureScale()
      renderer.getDrawingBufferSize(drawingSize)
      return {
        width: Math.max(1, Math.round(drawingSize.width * scale)),
        height: Math.max(1, Math.round(drawingSize.height * scale))
      }
    }

    let reflectionSampler: ReturnType<typeof reflector> | null = null
    let reflectionTarget: THREE.WebGLRenderTarget | null = null
    let refractionTarget: THREE.WebGLRenderTarget | null = null
    let samplers: WaterMaterialSamplers

    if (isWebGPU) {
      const sampler = reflector({ bounces: false, samples: 0 })
      sampler.reflector.resolutionScale = computeCaptureScale()
      // Geometry vertices are already rotated into XZ space, so the reflector
      // target itself must explicitly expose a +Y plane normal.
      sampler.target.rotation.x = -Math.PI / 2
      reflectionSampler = sampler

      samplers = {
        sampleReflection: (distortion) => {
          const baseUv = sampler.uvNode ?? screenUV.flipX()
          sampler.uvNode = baseUv.add(distortion)
          return sampler.rgb
        },
        sampleRefraction: (offset) =>
          viewportSharedTexture(viewportSafeUV(screenUV.sub(offset))).rgb
      }
    } else {
      const captureSize = computeCaptureSize()
      const reflection = new THREE.WebGLRenderTarget(captureSize.width, captureSize.height, {
        type: THREE.HalfFloatType,
        samples: 0
      })
      const refraction = new THREE.WebGLRenderTarget(captureSize.width, captureSize.height, {
        type: THREE.HalfFloatType,
        samples: 0
      })
      reflectionTarget = reflection
      refractionTarget = refraction

      samplers = {
        sampleReflection: (distortion) =>
          texture(reflection.texture, screenUV.flipX().add(distortion)).rgb,
        // The WebGL capture is rendered into a linear half float target, while
        // the WebGPU viewport texture exposes the display encoded canvas, so
        // the sample is encoded here to match both backends.
        sampleRefraction: (offset) =>
          sRGBTransferOETF(texture(refraction.texture, screenUV.sub(offset)).rgb) as Node<'vec3'>
      }
    }

    const material = createWaterMaterial({
      timeNode: uTime,
      underwaterNode: uUnderwater,
      noiseMap: noiseTexture,
      sunDirection: uSunDirection,
      samplers
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'Water'
    mesh.frustumCulled = false
    mesh.position.set(positionX, positionY, positionZ)
    // Draw after the rest of the scene so the viewport captures include it.
    mesh.renderOrder = 5
    if (reflectionSampler) {
      mesh.add(reflectionSampler.target)
    }
    scene.add(mesh)

    const mirrorCamera = camera.clone()

    const captureViews = () => {
      if (!reflectionTarget || !refractionTarget) {
        return
      }

      const previousRenderTarget = renderer.getRenderTarget()
      // Both captures must exclude the water surface itself.
      mesh.visible = false

      renderer.setRenderTarget(refractionTarget)
      renderer.clear()
      renderer.render(scene, camera)

      if (updateMirrorCamera(camera, mesh, mirrorCamera)) {
        renderer.setRenderTarget(reflectionTarget)
        renderer.clear()
        renderer.render(scene, mirrorCamera)
      }

      renderer.setRenderTarget(previousRenderTarget)
      mesh.visible = true
    }

    let resizeObserver: ResizeObserver | undefined
    if (container) {
      resizeObserver = new ResizeObserver(() => {
        if (isWebGPU) {
          if (reflectionSampler) {
            reflectionSampler.reflector.resolutionScale = computeCaptureScale()
          }
          return
        }
        const captureSize = computeCaptureSize()
        reflectionTarget?.setSize(captureSize.width, captureSize.height)
        refractionTarget?.setSize(captureSize.width, captureSize.height)
      })
      resizeObserver.observe(container)
    }

    // Use a dedicated requestAnimationFrame loop instead of addBeforeFrame to
    // avoid triggering the Scene's beforeFrameSetRef render path (which skips
    // renderer.clear() and background — problematic on WebGPU). The Scene
    // registers its own loop first, so the captures happen after the frame
    // has been rendered and are one frame behind.
    const startTimestamp = performance.now()
    let underwaterMix = 0

    const animate = () => {
      const elapsed = (performance.now() - startTimestamp) / 1000
      uTime.value = elapsed

      // The CPU sampler mirrors the GPU displacement, so the waterline test
      // follows the same surface the shader renders. The patch is sampled in
      // its own space, so the offset has to be removed from the camera.
      const cameraSurface = sampleOceanSurface(
        camera.position.x - positionX,
        camera.position.z - positionZ,
        elapsed
      )
      const underwaterTarget = camera.position.y < cameraSurface.height ? 1 : 0
      underwaterMix = THREE.MathUtils.lerp(underwaterMix, underwaterTarget, UNDERWATER_EASING)
      uUnderwater.value = underwaterMix

      if (!isWebGPU && underwaterMix < UNDERWATER_CAPTURE_SKIP) {
        captureViews()
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)

    // Cleanup on unmount
    return () => {
      unsubscribeSunDirection()
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      resizeObserver?.disconnect()
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      noiseTexture.dispose()
      reflectionSampler?.dispose()
      reflectionTarget?.dispose()
      refractionTarget?.dispose()
    }
  }, [sceneContext, captureResolution, segments, size, positionX, positionY, positionZ])

  return null
}

export default Water
