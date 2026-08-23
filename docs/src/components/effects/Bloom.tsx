import * as THREE from 'three'
import { Scene, Bloom } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface BloomProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function BloomComponent({ rendererType }: BloomProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 1.5, 3)

    // Set background color for better visibility
    scene.background = new THREE.Color(0x1a1a2e)

    const geometry = new THREE.BoxGeometry()

    // Left: Glowing cube (layer 1, bloom effect applied)
    const material0 = new THREE.MeshBasicMaterial({ color: 0xff5500 })
    const cube0 = new THREE.Mesh(geometry, material0)
    cube0.position.set(-0.5, 0, 0)
    cube0.layers.set(1)
    scene.add(cube0)

    // Right: Non-glowing cube (layer 0, for comparison)
    const material1 = new THREE.MeshBasicMaterial({ color: 0xff5500 })
    const cube1 = new THREE.Mesh(geometry, material1)
    cube1.position.set(0.5, 0, 0)
    cube1.layers.set(0)
    scene.add(cube1)
  }

  return (
    <div style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Scene rendererType={rendererType} onCreated={handleCreated} bgColor="#1a1a2e">
        <Bloom layer={1} strength={2} radius={1} threshold={0} />
      </Scene>
    </div>
  )
}
