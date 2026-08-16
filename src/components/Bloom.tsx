import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib'
import { RenderPipeline } from 'three/webgpu'
import { pass } from 'three/tsl'
import { bloom as tslBloom } from 'three/addons/tsl/display/BloomNode.js'
import { useScene } from '../context/SceneContext'
import type { SceneComponents, R3LRenderer } from '../context/SceneContext'

interface BloomProps {
  layer?: number
  strength?: number
  radius?: number
  threshold?: number
  children?: React.ReactNode
}

/**
 * Post-processing bloom effect.
 *
 * Uses two code paths depending on the active renderer:
 * - **WebGPURenderer**: `RenderPipeline` + TSL `bloom()` node (the modern
 *   node-based post-processing pipeline from `three/webgpu`).
 * - **WebGLRenderer**: `EffectComposer` + `UnrealBloomPass` from three-stdlib
 *   (the classic pass-based approach).
 *
 * For `layer === 0` the bloom replaces the main frame callback entirely.
 * For `layer > 0` bloom is rendered in `beforeFrame` (only objects in that
 * layer), then the main scene renders on top.
 */
const Bloom = ({
  layer = 0,
  strength = 1,
  radius = 0.5,
  threshold = 0.5,
  children
}: BloomProps) => {
  const sceneContext = useScene()
  const bloomComposerRef = useRef<EffectComposer | null>(null)
  const postProcessingRef = useRef<RenderPipeline | null>(null)

  useEffect(() => {
    const { renderer, scene, sceneComponents, container, setFrame, addBeforeFrame } = sceneContext

    if (!renderer || !scene || !sceneComponents?.camera || !sceneComponents?.light || !container) {
      return
    }

    const { camera, light } = sceneComponents

    light.layers.enable(layer)
    camera.layers.enable(layer)

    const width = container.clientWidth
    const height = container.clientHeight

    let removeBeforeFrame: (() => void) | undefined

    const isWebGPU = renderer.isWebGPURenderer === true

    if (isWebGPU) {
      // --- WebGPU path: RenderPipeline + TSL BloomNode ---
      // API: pass(scene, camera) → getTextureNode('output') → bloom(textureNode)
      // → outputNode = scenePassColor.add(bloomPass)

      const scenePass = pass(scene, camera)

      // For selective bloom (layer > 0), restrict the pass to only render
      // objects in the bloom layer.
      if (layer > 0) {
        const bloomLayers = new THREE.Layers()
        bloomLayers.set(layer)
        scenePass.setLayers(bloomLayers)
      }

      const scenePassColor = scenePass.getTextureNode('output')
      const bloomPass = tslBloom(scenePassColor, strength, radius, threshold)

      const postProcessing = new RenderPipeline(renderer)
      postProcessing.outputNode = scenePassColor.add(bloomPass)
      postProcessingRef.current = postProcessing

      if (layer === 0) {
        // layer 0: bloom replaces the main render entirely
        setFrame?.(() => {
          postProcessing.render()
        })
      } else {
        // layer > 0: render bloom first, then main scene on top
        removeBeforeFrame = addBeforeFrame?.(() => {
          postProcessing.render()
          renderer.clearDepth()
        })
      }
    } else {
      // --- WebGL path: EffectComposer + UnrealBloomPass (existing) ---

      const bloomComposer = new EffectComposer(renderer as unknown as THREE.WebGLRenderer)
      bloomComposer.addPass(new RenderPass(scene, camera))
      bloomComposer.addPass(
        new UnrealBloomPass(new THREE.Vector2(width, height), strength, radius, threshold)
      )
      bloomComposerRef.current = bloomComposer

      if (layer === 0) {
        // layer 0: Apply bloom to all objects
        setFrame?.((renderer: R3LRenderer, _scene: THREE.Scene, components: SceneComponents) => {
          renderer.clear()
          components.camera.layers.set(layer)
          bloomComposer.render()
        })
      } else {
        // layer > 0: Apply bloom only to objects in that layer
        removeBeforeFrame = addBeforeFrame?.(
          (renderer: R3LRenderer, _scene: THREE.Scene, components: SceneComponents) => {
            renderer.clear()
            components.camera.layers.set(layer)
            bloomComposer.render()
            renderer.clearDepth()
          }
        )
      }
    }

    // Cleanup
    return () => {
      removeBeforeFrame?.()
      bloomComposerRef.current?.dispose()
      bloomComposerRef.current = null
      postProcessingRef.current?.dispose()
      postProcessingRef.current = null
      light.layers.disable(layer)
      camera.layers.disable(layer)
    }
  }, [sceneContext, layer, strength, radius, threshold])

  return <>{children}</>
}

export default Bloom
