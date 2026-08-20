import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, LightGradient } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface LightGradientProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function LightGradientComponent({ rendererType }: LightGradientProps) {
  const gradientRef = useRef<LightGradient | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, light } = components
    if (!camera || !light) return

    camera.position.set(0, 0, 4)
    camera.lookAt(0, 0, 0)

    // Add a orange cube to show the lighting effect
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6600,
      roughness: 0.5,
      metalness: 0.5
    })
    meshRef.current = new THREE.Mesh(geometry, material)
    meshRef.current.position.y = 0.75
    scene.add(meshRef.current)

    // Loop gradient animation
    const loopGradient = () => {
      // Reset all lights in the group to base intensity before starting
      // a new gradient cycle. light is a Group (AmbientLight + DirectionalLight).
      light.traverse((child) => {
        if ((child as THREE.Light).isLight) {
          ;(child as THREE.Light).intensity = 2
        }
      })
      gradientRef.current?.dispose()
      gradientRef.current = new LightGradient(light, {
        intensity: 20,
        duration: 4000,
        onComplete: loopGradient
      })
    }

    loopGradient()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      gradientRef.current?.dispose()
      gradientRef.current = null
      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as THREE.Material).dispose()
        meshRef.current = null
      }
    }
  }, [])

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
