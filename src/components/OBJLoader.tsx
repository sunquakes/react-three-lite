import { useEffect } from 'react'
import { Scene, Group } from 'three'
import { OBJLoader as OBJLoaderUtil } from '../utils/ModelLoader'
import { useScene } from '../context/SceneContext'

interface LoadEvent {
  type: 'cache' | 'fetch' | 'parse'
  progress: number
}

interface OBJLoaderProps {
  modelUrl: string
  mtlUrl: string
  scene?: Scene
  scale?: [number, number, number]
  cache?: boolean
  onProgress?: (event: LoadEvent) => void
  onLoaded?: (model: Group) => void
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

  useEffect(() => {
    const init = async () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) return

      const model = await OBJLoaderUtil(modelUrl, mtlUrl, cache, (event) =>
        onProgress?.(event)
      )
      model.scale.set(...scale)
      scene.add(model)
      onLoaded?.(model)
    }
    init()
  }, [])

  return null
}

export default OBJLoader
