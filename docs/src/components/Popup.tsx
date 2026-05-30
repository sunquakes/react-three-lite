import { useEffect, useRef } from 'react'
import { Scene, Popup } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'
import TrafficLight from './TrafficLight'

export default function PopupComponent() {
  const sceneRef = useRef<THREE.Scene>()

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    sceneRef.current = scene
    camera.position.set(0, 1.5, 3)

    // Create popup with React component at starting position [0, 0.5, 0]
    const popup = new Popup([0, 0.5, 0], <TrafficLight />, {})
    scene.add(popup.scene!)
    
    // Move popup vertically upward to [0, 1.2, 0] with 2 seconds animation
    popup.moveTo([0, 1.2, 0], 2000)
  }

  return (
    <Scene 
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} 
      onCreated={handleCreated} 
    />
  )
}