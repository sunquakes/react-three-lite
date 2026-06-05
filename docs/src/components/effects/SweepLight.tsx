import { useRef, useEffect } from 'react'
import { Scene, GLTFLoaderAsync, SweepLight } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function SweepLightComponent() {
  const sweepLightRef = useRef<SweepLight | null>(null)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)

    sweepLightRef.current = new SweepLight(model)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sweepLightRef.current?.dispose()
      sweepLightRef.current = null
    }
  }, [])

  return (
    <Scene bgColor="#0a0a0a" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
