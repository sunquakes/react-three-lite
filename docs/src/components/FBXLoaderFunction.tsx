import { useCallback } from 'react'
import { Scene, FBXLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface FBXLoaderFunctionProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function FBXLoaderFunctionComponent({ rendererType }: FBXLoaderFunctionProps) {
  const handleCreated = useCallback(async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)

    const model = await FBXLoaderAsync('/models/perseverance.fbx')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)
  }, [])

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} bgColor="#1a1a2e" onCreated={handleCreated}>
    </Scene>
  )
}
