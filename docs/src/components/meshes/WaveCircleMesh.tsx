import { useRef } from 'react'
import { Scene, WaveCircleMesh } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface WaveCircleMeshProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function WaveCircleMeshComponent({ rendererType }: WaveCircleMeshProps) {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    sceneRef.current = scene
    camera.position.set(0, 2, 0)

    const mesh = new WaveCircleMesh()
    scene.add(mesh)
  }

  return (
    <div style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Scene rendererType={rendererType} bgColor="#1a1a2e" onCreated={handleCreated} />
    </div>
  )
}
