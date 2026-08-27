import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader as FBXLoaderUtil, disposeModel } from '../utils/ModelLoader'
import { useScene } from '../context/SceneContext'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

interface FBXLoaderProps {
  modelUrl: string
  scene?: THREE.Scene
  scale?: [number, number, number]
  cache?: boolean
  onProgress?: (event: LoadEvent) => void
  onLoaded?: (model: THREE.Group) => void
}

const FBXLoader = ({
  modelUrl,
  scene: propScene,
  scale = [1, 1, 1],
  cache = true,
  onProgress,
  onLoaded
}: FBXLoaderProps) => {
  const sceneContext = useScene()
  const modelRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) return

      const model = await FBXLoaderUtil(modelUrl, cache, (event) =>
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
        // disposeModel detaches the model from its actual parent and releases
        // geometries, materials and textures.
        disposeModel(modelRef.current)
        modelRef.current = null
      }
    }
  }, [propScene, sceneContext?.scene, modelUrl, scale, cache, onProgress, onLoaded])

  return null
}

export default FBXLoader
