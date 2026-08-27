import * as THREE from 'three'
import { Scene, Rain } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface RainProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function RainComponent({ rendererType }: RainProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return
    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)
  }

  return (
    <Scene rendererType={rendererType} onCreated={handleCreated} bgColor="#1a1a2e" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
    </Scene>
  )
}
