import { useRef, useEffect } from 'react'
import { Scene, GLTFLoaderAsync, SweepLight } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function SweepLightComponent() {
  const sweepLightsRef = useRef<{ sweepLight: SweepLight; mesh: THREE.Mesh }[]>([])

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(3, 2, 5)
    camera.lookAt(0, 0, 0)

    const model = await GLTFLoaderAsync('/models/perseverance-draco.glb', true)
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)

    // Collect all meshes from the model
    const meshes: THREE.Mesh[] = []
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshes.push(child as THREE.Mesh)
      }
    })

    console.log('Found meshes:', meshes.length)

    // Create sweep light for each mesh
    meshes.forEach((mesh) => {
      console.log('Creating SweepLight for mesh:', mesh.name)
      const sweepLight = new SweepLight(scene, mesh, {
        color: 0x00ffff,
        speed: 1.0,
        width: 0.3,
        intensity: 1.5,
        direction: 0,
      })
      sweepLightsRef.current.push({ sweepLight, mesh })
    })
  }

  const handleBeforeFrame = (_renderer: THREE.WebGLRenderer, _scene: THREE.Scene, _components: SceneComponents) => {
    sweepLightsRef.current.forEach(({ sweepLight, mesh }) => {
      sweepLight.update(mesh)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sweepLightsRef.current = []
    }
  }, [])

  return (
    <Scene bgColor="#0a0a0a" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} onBeforeFrame={handleBeforeFrame} />
  )
}
