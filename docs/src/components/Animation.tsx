import { useRef } from 'react'
import { Scene, Animation, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function AnimationComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 1, 4)

    const model = await GLTFLoaderAsync('/models/perseverance.glb')
    model.position.set(0, -0.5, 0)
    scene.add(model)

    const animation = new Animation(model)
    animation.playAll()
  }

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} bgColor="#FAEBD7" onCreated={handleCreated} />
  )
}
