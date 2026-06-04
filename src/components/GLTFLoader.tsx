import { useEffect, useRef } from 'react'
import { Scene, Group } from 'three'
import { GLTFLoader as GLTFLoaderUtil } from '../utils/ModelLoader'
import { useScene } from '../context/SceneContext'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

interface GLTFLoaderProps {
  modelUrl: string
  scene?: Scene
  scale?: [number, number, number]
  cache?: boolean
  dracoDecoderPath?: string
  useDraco?: boolean
  onProgress?: (event: LoadEvent) => void
  onLoaded?: (model: Group) => void
}

const GLTFLoader = ({
  modelUrl,
  scene: propScene,
  scale = [1, 1, 1],
  cache = true,
  dracoDecoderPath,
  useDraco,
  onProgress,
  onLoaded
}: GLTFLoaderProps) => {
  const sceneContext = useScene()
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    
    const init = async () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) {
        console.warn('GLTFLoader: Scene not available yet, retrying...')
        setTimeout(init, 100)
        return
      }

      loadedRef.current = true
      const model = await GLTFLoaderUtil(modelUrl, useDraco, dracoDecoderPath, cache, (event) =>
        onProgress?.(event)
      )
      model.scale.set(...scale)
      scene.add(model)
      onLoaded?.(model)
    }
    init()
  }, [propScene, sceneContext?.scene, modelUrl, scale, cache, dracoDecoderPath, onProgress, onLoaded])

  return null
}

export default GLTFLoader
