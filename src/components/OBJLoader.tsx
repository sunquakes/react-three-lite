import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader as OBJLoaderUtil } from '../utils/ModelLoader'
import { useScene } from '../context/SceneContext'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

interface OBJLoaderProps {
  modelUrl: string
  mtlUrl: string
  scene?: THREE.Scene
  scale?: [number, number, number]
  cache?: boolean
  onProgress?: (event: LoadEvent) => void
  onLoaded?: (model: THREE.Group) => void
}

const OBJLoader = ({
  modelUrl,
  mtlUrl,
  scene: propScene,
  scale = [1, 1, 1],
  cache = true,
  onProgress,
  onLoaded
}: OBJLoaderProps) => {
  const sceneContext = useScene()
  const modelRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) return

      const model = await OBJLoaderUtil(modelUrl, mtlUrl, cache, (event) =>
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
  }, [propScene, sceneContext?.scene, modelUrl, mtlUrl, scale, cache, onProgress, onLoaded])

  return null
}

export default OBJLoader
