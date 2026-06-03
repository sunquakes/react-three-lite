import * as THREE from 'three'
import { Scene, Snow } from 'react-three-lite'

export default function SnowComponent() {
  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    if (!camera) return
    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)
  }

  return (
    <Scene onCreated={handleCreated} bgColor="#1e293b" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Snow count={2000} speed={0.5} color={0xffffff} range={25} height={18} windX={0.3} windZ={0.1} />
    </Scene>
  )
}
