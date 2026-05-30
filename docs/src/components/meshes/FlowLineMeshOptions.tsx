import { useRef } from 'react'
import { Scene, FlowLineMesh, AxisType } from 'react-three-lite'
import * as THREE from 'three'

export default function FlowLineMeshOptionsComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, { camera }: any) => {
    if (!camera) return

    sceneRef.current = scene
    camera.position.set(0, 0, 3)
    camera.lookAt(0, 0, 0)

    const points = [
      new THREE.Vector3(-2.000000, 0.000000, 0),
      new THREE.Vector3(-1.975377, 0.312869, 0),
      new THREE.Vector3(-1.902113, 0.618034, 0),
      new THREE.Vector3(-1.782013, 0.907981, 0),
      new THREE.Vector3(-1.618034, 1.175571, 0),
      new THREE.Vector3(-1.414214, 1.414214, 0),
      new THREE.Vector3(-1.175571, 1.618034, 0),
      new THREE.Vector3(-0.907981, 1.782013, 0),
      new THREE.Vector3(-0.618034, 1.902113, 0),
      new THREE.Vector3(-0.312869, 1.975377, 0),
      new THREE.Vector3(-0.000000, 2.000000, 0),
      new THREE.Vector3(0.312869, 1.975377, 0),
      new THREE.Vector3(0.618034, 1.902113, 0),
      new THREE.Vector3(0.907981, 1.782013, 0),
      new THREE.Vector3(1.175571, 1.618034, 0),
      new THREE.Vector3(1.414214, 1.414214, 0),
      new THREE.Vector3(1.618034, 1.175571, 0),
      new THREE.Vector3(1.782013, 0.907981, 0),
      new THREE.Vector3(1.902113, 0.618034, 0),
      new THREE.Vector3(1.975377, 0.312869, 0),
      new THREE.Vector3(2.000000, 0.000000, 0)
    ]

    const mesh = new FlowLineMesh({
      points,
      color: [0.0, 1.0, 1.0, 1],
      speed: 2,
      width: 0.4,
      axis: AxisType.Z,
      textureRepeat: 10
    })

    scene.add(mesh)
  }

  return (
    <div style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <Scene onCreated={handleCreated} />
    </div>
  )
}
