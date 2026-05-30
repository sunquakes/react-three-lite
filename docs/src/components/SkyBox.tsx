import { useEffect, useRef } from 'react'
import { Scene, SkyBox } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function SkyBoxComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 0, 3)
  }

  useEffect(() => {
    if (sceneRef.current) {
      const skyBox = new SkyBox([
        '/images/examples/skybox/right.jpg',
        '/images/examples/skybox/left.jpg',
        '/images/examples/skybox/top.jpg',
        '/images/examples/skybox/bottom.jpg',
        '/images/examples/skybox/front.jpg',
        '/images/examples/skybox/back.jpg'
      ])
      sceneRef.current.background = skyBox.scene
    }
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }} gridHelper={false} onCreated={handleCreated} />
  )
}