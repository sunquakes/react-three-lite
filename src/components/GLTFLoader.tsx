import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader as GLTFLoaderUtil } from '../utils/ModelLoader'
import { useScene } from '../context/SceneContext'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

interface GLTFLoaderProps {
  modelUrl: string
  scene?: THREE.Scene
  scale?: [number, number, number]
  cache?: boolean
  dracoDecoderPath?: string
  useDraco?: boolean
  onProgress?: (event: LoadEvent) => void
  onLoaded?: (model: THREE.Group) => void
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
  const modelRef = useRef<THREE.Group | null>(null)

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
          const obj = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }
          if (obj.geometry) {
            obj.geometry.dispose()
          }
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose())
            } else {
              obj.material.dispose()
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
