import { useRef } from 'react'
import { Scene, WaveCircleMesh, AxisType } from 'react-three-lite'
import type * as THREE from 'three'

export default function WaveCircleMeshOptionsComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    if (!camera) return

    sceneRef.current = scene
    camera.position.set(2, 0, 0)

    const mesh = new WaveCircleMesh({
      radius: 0.5,
      color: [0.98, 0.61, 0.6, 1],
      speed: 2,
      verticalAxis: AxisType.X
    })
    scene.add(mesh)
    mesh.position.set(0, 0.5, 0)
  }

  return (
    <div style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated} />
    </div>
  )
}
