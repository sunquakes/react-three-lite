import { useRef } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function IndexComponent({ rendererType }: { rendererType?: 'webgpu' | 'webgl' }) {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    sceneRef.current = scene
    camera.position.set(0, 1, 3)
  }

  return (
    <div style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Scene rendererType={rendererType} onCreated={handleCreated} />
    </div>
  )
}
