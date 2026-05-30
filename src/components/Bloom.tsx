import { useEffect, useRef } from 'react'
import { Vector2, WebGLRenderer, Scene } from 'three'
import { EffectComposer, RenderPass, UnrealBloomPass } from 'three-stdlib'
import { useScene } from '../context/SceneContext'

interface BloomProps {
  layer?: number
  strength?: number
  radius?: number
  threshold?: number
  children?: React.ReactNode
}

const Bloom = ({
  layer = 0,
  strength = 1,
  radius = 0.5,
  threshold = 0.5,
  children
}: BloomProps) => {
  const sceneContext = useScene()
  const bloomComposerRef = useRef<EffectComposer | null>(null)

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

    // Create bloom composer
    const bloomComposer = new EffectComposer(renderer)
    bloomComposer.addPass(new RenderPass(scene, camera))
    bloomComposer.addPass(new UnrealBloomPass(
      new Vector2(width, height),
      strength,
      radius,
      threshold
    ))
    bloomComposerRef.current = bloomComposer

    if (layer === 0) {
      // layer 0: Apply bloom to all objects
      setFrame?.(
        (renderer: WebGLRenderer, scene: Scene, components: any) => {
          renderer.clear()
          components.camera.layers.set(layer)
          bloomComposer.render()
        }
      )
    } else {
      // layer > 0: Apply bloom only to objects in that layer
      addBeforeFrame?.(
        (renderer: WebGLRenderer, scene: Scene, components: any) => {
          renderer.clear()
          components.camera.layers.set(layer)
          bloomComposer.render()
          renderer.clearDepth()
        }
      )
    }

    // Cleanup
    return () => {
      bloomComposer.dispose()
      bloomComposerRef.current = null
    }
  }, [sceneContext, layer, strength, radius, threshold])

  return <>{children}</>
}

export default Bloom
