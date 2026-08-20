import { useRef, useEffect } from 'react'
import { Scene, ModelRotator, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface ModelRotatorProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function ModelRotatorComponent({ rendererType = 'webgpu' }: ModelRotatorProps = {}) {
  const rotatorRef = useRef<ModelRotator | null>(null)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.position.set(0, 0, 0)
    scene.add(model)

    rotatorRef.current = new ModelRotator(model, {
      axis: 'y',
      speed: 0.5,
      autoStart: true,
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      rotatorRef.current?.dispose()
      rotatorRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} bgColor="#1a1a2e" onCreated={handleCreated} />
  )
}
