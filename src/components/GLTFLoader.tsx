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
  useDraco = true,
  onProgress,
  onLoaded
}: GLTFLoaderProps) => {
  const sceneContext = useScene()
  const modelRef = useRef<Group | null>(null)

  useEffect(() => {
    let cancelled = false
    
    const init = async () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) {
        console.warn('GLTFLoader: Scene not available yet, retrying...')
        setTimeout(init, 100)
        return
      }

      const model = await GLTFLoaderUtil(modelUrl, useDraco, dracoDecoderPath, cache, (event) =>
        onProgress?.(event)
      )
      if (cancelled) return
      
      model.scale.set(...scale)
      scene.add(model)
      modelRef.current = model
      onLoaded?.(model)
    }
    init()

    return () => {
      cancelled = true
      if (modelRef.current) {
        const scene = propScene || sceneContext?.scene
        if (scene) {
          scene.remove(modelRef.current)
        }
        modelRef.current.traverse((child) => {
          if ('geometry' in child) {
            ;(child as any).geometry?.dispose()
          }
          if ('material' in child) {
            const material = (child as any).material
            if (Array.isArray(material)) {
              material.forEach((m: any) => m?.dispose())
            } else {
              material?.dispose()
            }
          }
        })
        modelRef.current = null
      }
    }
  }, [propScene, sceneContext?.scene, modelUrl, scale, cache, dracoDecoderPath, useDraco, onProgress, onLoaded])

  return null
}

export default GLTFLoader
