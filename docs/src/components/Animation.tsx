import { useRef } from 'react'
import { Scene, Animation, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface AnimationProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function AnimationComponent({ rendererType = 'webgpu' }: AnimationProps = {}) {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 1.8, 4)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.position.set(0, 0, 0)
    scene.add(model)

    const animation = new Animation(model)
    animation.playAll()
  }

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} bgColor="#1a1a2e" onCreated={handleCreated} />
  )
}
