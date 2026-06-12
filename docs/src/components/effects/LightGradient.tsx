import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, lightGradient } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function LightGradientComponent() {
  const cleanupRef = useRef<(() => void) | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const isBrightRef = useRef(true)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light } = components
    if (!camera || !light) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    // Add a cube to show the lighting effect
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.5
    })
    meshRef.current = new THREE.Mesh(geometry, material)
    meshRef.current.position.y = 0.75
    scene.add(meshRef.current)

    // Loop brightness change
    const loopGradient = () => {
      if (isBrightRef.current) {
        cleanupRef.current = lightGradient(light, {
          intensity: 20,
          duration: 4000,
          onComplete: () => {
            isBrightRef.current = false
            loopGradient()
          }
        })
      } else {
        cleanupRef.current = lightGradient(light, {
          intensity: 2,
          duration: 4000,
          onComplete: () => {
            isBrightRef.current = true
            loopGradient()
          }
        })
      }
    }

    loopGradient()
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
