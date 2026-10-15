import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { NodeMaterial, RenderPipeline, type Node } from 'three/webgpu'
import {
  Fn,
  uniform,
  float,
  vec3,
  vec4,
  texture,
  screenUV,
  pass,
  positionLocal,
  getViewPosition,
  renderOutput,
  mx_noise_float,
  abs,
  clamp,
  dot,
  exp2,
  length,
  max,
  min,
  normalize,
  oneMinus,
  pow,
  saturate,
  select
} from 'three/tsl'
import { useScene } from '../context/SceneContext'

interface HeightFogProps {
  fogColor?: string | number | THREE.Color
  fogDensity?: number
  fogHeight?: number
  fogHeightFalloff?: number
  fogMaxOpacity?: number
  fogStartDistance?: number
  noiseStrength?: number
  noiseScale?: number
  noiseSpeedX?: number
  noiseSpeedZ?: number
  inscatteringColor?: string | number | THREE.Color
  inscatteringIntensity?: number
  inscatteringExponent?: number
  inscatteringStartDistance?: number
  lightAzimuth?: number
  lightElevation?: number
  children?: React.ReactNode
}

interface HeightFogNodeUniforms {
  cameraPosition: Node<'vec3'>
  cameraFar: Node<'float'>
  cameraWorldMatrix: Node<'mat4'>
  cameraProjectionMatrixInverse: Node<'mat4'>
  fogColor: Node<'vec3'>
  fogDensity: Node<'float'>
  fogHeight: Node<'float'>
  fogHeightFalloff: Node<'float'>
  fogMaxOpacity: Node<'float'>
  fogStartDistance: Node<'float'>
  noiseStrength: Node<'float'>
  noiseScale: Node<'float'>
  noiseSpeedX: Node<'float'>
  noiseSpeedZ: Node<'float'>
  noiseTime: Node<'float'>
  inscatteringColor: Node<'vec3'>
  inscatteringIntensity: Node<'float'>
  inscatteringExponent: Node<'float'>
  inscatteringStartDistance: Node<'float'>
  lightDirection: Node<'vec3'>
}

const LN2 = 0.6931471805599453

/**
 * Analytic optical depth of an exponential height fog layer integrated along a
 * ray segment. The density at world height y is `density * 2^(falloff * (height
 * - y))`, i.e. it halves every time y rises by 1/falloff above the fog plane.
 * The closed-form line integral avoids ray marching.
 */
const opticalDepth = (
  density: Node<'float'>,
  rayLength: Node<'float'>,
  y0: Node<'float'>,
  y1: Node<'float'>,
  height: Node<'float'>,
  falloff: Node<'float'>
): Node<'float'> => {
  const e0 = falloff.mul(height.sub(y0))
  const e1 = falloff.mul(height.sub(y1))
  const x = abs(e0.sub(e1))
  // (1 - 2^-x) / (x * ln2) tends to 1 as x -> 0, so switch to the constant
  // limit below a threshold instead of dividing by a near-zero x.
  const lineIntegral = select(
    x.lessThan(0.01),
    float(1.0),
    oneMinus(exp2(x.negate())).div(x.mul(LN2))
  )
  return density.mul(rayLength).mul(exp2(min(max(e0, e1), float(126.0)))).mul(lineIntegral)
}

/**
 * Shared TSL fog node used by both renderers. Reconstructs the world position
 * of every fragment from the depth buffer, accumulates exponential height fog
 * along the view ray and composites fog color, directional inscattering and
 * the scene color in linear space.
 *
 * `sceneDepth` is intentionally untyped: depth texture nodes are declared as
 * 'vec4' statically but evaluate to a single float at runtime, so the node is
 * forwarded to `getViewPosition` untouched (no swizzle, no arithmetic).
 */
const buildFogNode = (
  sceneColor: Node<'vec4'>,
  sceneDepth: Node,
  u: HeightFogNodeUniforms
): Node<'vec4'> => {
  const viewPosition = getViewPosition(screenUV, sceneDepth, u.cameraProjectionMatrixInverse)
  const worldPosition = u.cameraWorldMatrix.mul(vec4(viewPosition, 1.0)).xyz

  const toFragment = worldPosition.sub(u.cameraPosition)
  const rayLength = length(toFragment)
  const rayDirection = normalize(toFragment)

  // Flowing noise displaces the fog plane. Sky fragments (nothing rendered,
  // depth on the far plane) have no meaningful world position, so their noise
  // is sampled where the view ray crosses the fog plane instead.
  const isSky = rayLength.greaterThan(u.cameraFar.mul(0.95))
  const tToFogPlane = clamp(
    select(
      abs(rayDirection.y).greaterThan(0.001),
      u.fogHeight.sub(u.cameraPosition.y).div(rayDirection.y),
      float(0.0)
    ),
    float(0.0),
    float(2.0).div(max(u.noiseScale, float(0.0001)))
  )
  const skyNoisePosition = u.cameraPosition.add(rayDirection.mul(tToFogPlane))
  const noisePosition = select(isSky, skyNoisePosition, worldPosition)
  const noiseOffset = vec3(u.noiseTime.mul(u.noiseSpeedX), float(0.0), u.noiseTime.mul(u.noiseSpeedZ))
  const noise = mx_noise_float(noisePosition.mul(u.noiseScale).add(noiseOffset))
  const noisyFogHeight = u.fogHeight.add(noise.mul(u.noiseStrength))

  // Optical depth for the main fog. The first fogStartDistance units along
  // the ray are excluded so fog does not build up directly at the camera.
  const fogExcludedLength = clamp(u.fogStartDistance, float(0.0), rayLength)
  const fogStartY = u.cameraPosition.y.add(rayDirection.y.mul(fogExcludedLength))
  const tau = opticalDepth(
    u.fogDensity,
    rayLength.sub(fogExcludedLength),
    fogStartY,
    worldPosition.y,
    noisyFogHeight,
    u.fogHeightFalloff
  )
  const transmittance = max(saturate(exp2(tau.negate())), oneMinus(u.fogMaxOpacity))

  // Directional inscattering towards the light, with its own start distance.
  const cosAngle = saturate(dot(rayDirection, u.lightDirection))
  const dirExcludedLength = clamp(u.inscatteringStartDistance, float(0.0), rayLength)
  const dirStartY = u.cameraPosition.y.add(rayDirection.y.mul(dirExcludedLength))
  const dirTau = opticalDepth(
    u.fogDensity,
    rayLength.sub(dirExcludedLength),
    dirStartY,
    worldPosition.y,
    noisyFogHeight,
    u.fogHeightFalloff
  )
  const directionalInscattering = u.inscatteringColor
    .mul(u.inscatteringIntensity)
    .mul(pow(cosAngle, u.inscatteringExponent))
    .mul(oneMinus(saturate(exp2(dirTau.negate()))))

  const finalColor = u.fogColor
    .mul(oneMinus(transmittance))
    .add(directionalInscattering)
    .add(sceneColor.rgb.mul(transmittance))
  return vec4(finalColor, 1.0)
}

/**
 * Screen-space height fog post-processing effect.
 *
 * Uses two code paths depending on the active renderer:
 * - **WebGPURenderer**: `pass()` + `RenderPipeline` from three/webgpu. The fog
 *   node outputs linear color and RenderPipeline applies the output transform.
 * - **WebGLRenderer**: the scene is rendered into a half-float render target
 *   with a depth texture, then a fullscreen quad composites the fog and
 *   applies the linear -> sRGB output transform explicitly via `renderOutput`.
 *
 * Both paths share the same TSL fog node (`buildFogNode`).
 */
const HeightFog = ({
  fogColor = '#c9d4cc',
  fogDensity = 0.02,
  fogHeight = 10,
  fogHeightFalloff = 0.25,
  fogMaxOpacity = 1,
  fogStartDistance = 0,
  noiseStrength = 0,
  noiseScale = 0.012,
  noiseSpeedX = 0,
  noiseSpeedZ = 0,
  inscatteringColor = '#ffe2b0',
  inscatteringIntensity = 1,
  inscatteringExponent = 5,
  inscatteringStartDistance = 0,
  lightAzimuth = 30,
  lightElevation = 25,
  children
}: HeightFogProps) => {
  const sceneContext = useScene()
  const postProcessingRef = useRef<RenderPipeline | null>(null)
  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null)
  const quadMaterialRef = useRef<NodeMaterial | null>(null)
  const quadGeometryRef = useRef<THREE.PlaneGeometry | null>(null)

  useEffect(() => {
    const { renderer, scene, sceneComponents, container, setFrame } = sceneContext

    if (!renderer || !scene || !sceneComponents?.camera || !container) {
      return
    }

    const { camera } = sceneComponents

    // THREE.Color converts sRGB hex strings to the linear working color space
    // on construction, which matches the linear space of the scene render
    // target on both backends, so the raw components can be used directly.
    const fogColorLinear = new THREE.Color(fogColor)
    const inscatteringColorLinear = new THREE.Color(inscatteringColor)

    const azimuth = THREE.MathUtils.degToRad(lightAzimuth)
    const elevation = THREE.MathUtils.degToRad(lightElevation)
    const lightDirection = new THREE.Vector3(
      Math.cos(elevation) * Math.sin(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.cos(azimuth)
    ).normalize()

    // Camera state is forwarded through custom uniforms because the fog runs
    // in a post-processing pass whose active camera is an internal fullscreen
    // camera, so the built-in camera TSL nodes do not describe the scene camera.
    const uCameraPosition = uniform(new THREE.Vector3())
    const uCameraFar = uniform(camera.far)
    const uCameraWorldMatrix = uniform(new THREE.Matrix4())
    const uCameraProjectionMatrixInverse = uniform(new THREE.Matrix4())

    const uFogColor = uniform(new THREE.Vector3(fogColorLinear.r, fogColorLinear.g, fogColorLinear.b))
    const uFogDensity = uniform(fogDensity)
    const uFogHeight = uniform(fogHeight)
    const uFogHeightFalloff = uniform(fogHeightFalloff)
    const uFogMaxOpacity = uniform(fogMaxOpacity)
    const uFogStartDistance = uniform(fogStartDistance)
    const uNoiseStrength = uniform(noiseStrength)
    const uNoiseScale = uniform(noiseScale)
    const uNoiseSpeedX = uniform(noiseSpeedX)
    const uNoiseSpeedZ = uniform(noiseSpeedZ)
    const uNoiseTime = uniform(0)
    const uInscatteringColor = uniform(
      new THREE.Vector3(inscatteringColorLinear.r, inscatteringColorLinear.g, inscatteringColorLinear.b)
    )
    const uInscatteringIntensity = uniform(inscatteringIntensity)
    const uInscatteringExponent = uniform(inscatteringExponent)
    const uInscatteringStartDistance = uniform(inscatteringStartDistance)
    const uLightDirection = uniform(lightDirection)

    const fogUniforms: HeightFogNodeUniforms = {
      cameraPosition: uCameraPosition,
      cameraFar: uCameraFar,
      cameraWorldMatrix: uCameraWorldMatrix,
      cameraProjectionMatrixInverse: uCameraProjectionMatrixInverse,
      fogColor: uFogColor,
      fogDensity: uFogDensity,
      fogHeight: uFogHeight,
      fogHeightFalloff: uFogHeightFalloff,
      fogMaxOpacity: uFogMaxOpacity,
      fogStartDistance: uFogStartDistance,
      noiseStrength: uNoiseStrength,
      noiseScale: uNoiseScale,
      noiseSpeedX: uNoiseSpeedX,
      noiseSpeedZ: uNoiseSpeedZ,
      noiseTime: uNoiseTime,
      inscatteringColor: uInscatteringColor,
      inscatteringIntensity: uInscatteringIntensity,
      inscatteringExponent: uInscatteringExponent,
      inscatteringStartDistance: uInscatteringStartDistance,
      lightDirection: uLightDirection
    }

    const updateFrameUniforms = () => {
      camera.getWorldPosition(uCameraPosition.value)
      uCameraWorldMatrix.value.copy(camera.matrixWorld)
      uCameraProjectionMatrixInverse.value.copy(camera.projectionMatrix).invert()
      uCameraFar.value = camera.far
      uNoiseTime.value += 0.016
    }

    let resizeObserver: ResizeObserver | undefined

    if (renderer.isWebGPURenderer === true) {
      // --- WebGPU path: pass() + RenderPipeline ---
      const scenePass = pass(scene, camera)
      const scenePassColor = scenePass.getTextureNode('output')
      const scenePassDepth = scenePass.getTextureNode('depth')

      const postProcessing = new RenderPipeline(renderer)
      // Linear fog color: RenderPipeline applies the output color transform.
      postProcessing.outputNode = buildFogNode(scenePassColor, scenePassDepth, fogUniforms)
      postProcessingRef.current = postProcessing

      setFrame?.(() => {
        updateFrameUniforms()
        postProcessing.render()
      })
    } else {
      // --- WebGL path: scene -> render target, then fullscreen fog quad ---
      const width = Math.max(1, container.clientWidth)
      const height = Math.max(1, container.clientHeight)
      const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        type: THREE.HalfFloatType
      })
      renderTarget.depthTexture = new THREE.DepthTexture(width, height)
      renderTargetRef.current = renderTarget

      const quadScene = new THREE.Scene()
      const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      const quadGeometry = new THREE.PlaneGeometry(2, 2)
      const quadMaterial = new NodeMaterial()
      quadMaterial.depthTest = false
      quadMaterial.depthWrite = false
      quadMaterial.side = THREE.DoubleSide
      quadMaterial.vertexNode = Fn(() => vec4(positionLocal.xy, 0.0, 1.0))()

      const sceneColorNode = texture(renderTarget.texture, screenUV)
      const sceneDepthNode = texture(renderTarget.depthTexture, screenUV)
      // Custom fragment nodes bypass the WebGLNodesHandler output transform,
      // so the linear -> sRGB conversion is applied explicitly.
      quadMaterial.fragmentNode = renderOutput(
        buildFogNode(sceneColorNode, sceneDepthNode, fogUniforms),
        THREE.NoToneMapping,
        THREE.SRGBColorSpace
      )

      const quad = new THREE.Mesh(quadGeometry, quadMaterial)
      quad.frustumCulled = false
      quadScene.add(quad)
      quadMaterialRef.current = quadMaterial
      quadGeometryRef.current = quadGeometry

      // Keep the render target in sync with the container. The container can
      // be 0-sized on first mount, so only resize once it has a real size.
      resizeObserver = new ResizeObserver(() => {
        const w = container.clientWidth
        const h = container.clientHeight
        if (w > 0 && h > 0) {
          renderTarget.setSize(w, h)
        }
      })
      resizeObserver.observe(container)

      // Scene sets renderer.autoClear = false, so every target is cleared
      // explicitly before drawing.
      setFrame?.(() => {
        updateFrameUniforms()
        renderer.setRenderTarget(renderTarget)
        renderer.clear()
        renderer.render(scene, camera)
        renderer.setRenderTarget(null)
        renderer.clear()
        renderer.render(quadScene, quadCamera)
      })
    }

    // Cleanup on unmount
    return () => {
      resizeObserver?.disconnect()
      postProcessingRef.current?.dispose()
      postProcessingRef.current = null
      if (renderTargetRef.current) {
        renderTargetRef.current.depthTexture?.dispose()
        renderTargetRef.current.dispose()
        renderTargetRef.current = null
      }
      quadMaterialRef.current?.dispose()
      quadMaterialRef.current = null
      quadGeometryRef.current?.dispose()
      quadGeometryRef.current = null
    }
  }, [
    sceneContext,
    fogColor,
    fogDensity,
    fogHeight,
    fogHeightFalloff,
    fogMaxOpacity,
    fogStartDistance,
    noiseStrength,
    noiseScale,
    noiseSpeedX,
    noiseSpeedZ,
    inscatteringColor,
    inscatteringIntensity,
    inscatteringExponent,
    inscatteringStartDistance,
    lightAzimuth,
    lightElevation
  ])

  return <>{children}</>
}

export default HeightFog
