import { useEffect, useRef } from 'react'
import { Scene, SkyBox } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function SkyBoxComponent() {
  const skyBoxRef = useRef<SkyBox | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 0, 3)

    const skyBox = new SkyBox([
      '/images/examples/skybox/right.jpg',
      '/images/examples/skybox/left.jpg',
      '/images/examples/skybox/top.jpg',
      '/images/examples/skybox/bottom.jpg',
      '/images/examples/skybox/front.jpg',
      '/images/examples/skybox/back.jpg'
    ])
    skyBoxRef.current = skyBox
    scene.background = skyBox.scene
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      skyBoxRef.current?.scene.dispose()
      skyBoxRef.current = null
    }
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }} gridHelper={false} onCreated={handleCreated} />
  )
}
