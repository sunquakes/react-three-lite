import { useRef } from 'react'
import { Scene, Animation, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function IndexAnimationComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 1.5, 2.1)

    const model = await GLTFLoaderAsync('/models/perseverance.glb')
    model.scale.set(0.7, 0.7, 0.7)
    model.position.set(0, 0, 0)
    scene.add(model)

    const animation = new Animation(model)
    animation.playAll()
  }

  return (
    <Scene style={{ marginTop: '10px', width: '100%', height: '100%' }} onCreated={handleCreated} axesHelper={false} />
  )
}