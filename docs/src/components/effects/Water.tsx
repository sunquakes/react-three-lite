import * as THREE from 'three'
import { Scene, Water, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1.5, 3)

    // The water reads the shared sun direction from the global parameter bus.
    globalParameterBus.set('sunDirection', new THREE.Vector3(-0.58, 0.1, -0.81))
  }

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      bgColor="rgb(40, 42, 54)"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      <Water />
    </Scene>
  )
}
