import * as THREE from 'three'
import { Scene, Water } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

// Irregular lake shoreline in world units on the XZ plane, around the origin.
const LAKE_OUTLINE: [number, number][] = [
  [-8, -2.5],
  [-4.5, -5.5],
  [1.5, -6],
  [6.5, -3.5],
  [8, 1],
  [4.5, 5],
  [-1.5, 5.5],
  [-6.5, 3]
]

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components
    camera.position.set(0, 6, 15)
    controls.target.set(0, 0, 0)
    camera.lookAt(0, 0, 0)
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
      <Water shape={LAKE_OUTLINE} segments={160} />
    </Scene>
  )
}
