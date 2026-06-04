import { useEffect, useRef } from 'react'
import { Scene, Movable, GLTFLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function MovableElementComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 1.5, 3)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    if (model) {
      model.scale.set(0.8, 0.8, 0.8)
      scene.add(model)

      // Create movable element and animate it
      const movable = new Movable(model, [0, 0, -1])
      
      // Move the model from [0, 0, -1] to [0, 0, 0] over 10 seconds
      movable.moveTo([0, 0, 0], 10000)
    }
  }

  return (
    <Scene 
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} 
      onCreated={handleCreated} 
    />
  )
}