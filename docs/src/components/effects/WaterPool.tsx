import * as THREE from 'three'
import { Scene, WaterPool } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components
    camera.position.set(1.25, 0.9, 1.7)
    controls.target.set(0, -0.15, 0)
    camera.lookAt(0, -0.15, 0)
  }

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      bgColor="rgb(40, 42, 54)"
      axesHelper={false}
      gridHelper={false}
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      <WaterPool />
    </Scene>
  )
}
