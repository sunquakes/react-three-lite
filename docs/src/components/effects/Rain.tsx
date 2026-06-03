import * as THREE from 'three'
import { Scene, Rain } from 'react-three-lite'

export default function RainComponent() {
  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    if (!camera) return
    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)
  }

  return (
    <Scene onCreated={handleCreated} bgColor="#0f172a" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Rain count={3000} speed={0.8} color={0x87ceeb} range={30} height={20} />
    </Scene>
  )
}
