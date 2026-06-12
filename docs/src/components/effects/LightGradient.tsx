import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, lightGradient } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function LightGradientComponent() {
  const cleanupRef = useRef<(() => void) | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light } = components
    if (!camera || !light) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    // Add a sphere to show the lighting effect
    const geometry = new THREE.SphereGeometry(1, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.5
    })
    meshRef.current = new THREE.Mesh(geometry, material)
    scene.add(meshRef.current)

    cleanupRef.current = lightGradient(light, {
      color: '#ff6600',
      intensity: 15,
      duration: 3000
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
    }
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
