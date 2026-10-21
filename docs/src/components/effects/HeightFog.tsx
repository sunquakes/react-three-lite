import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, HeightFog } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface HeightFogProps {
  rendererType?: 'webgpu' | 'webgl'
}

// Columns receding into the distance: [x, z, width, height].
const pillars: [number, number, number, number][] = [
  [-5, 5, 2.8, 13],
  [6, 2, 3.2, 17],
  [-2, -4, 2.6, 11],
  [8, -9, 3.4, 21],
  [-9, -15, 3.0, 15],
  [3, -22, 2.8, 19],
  [-6, -30, 3.4, 23]
]

export default function HeightFogComponent({ rendererType }: HeightFogProps) {
  const meshesRef = useRef<THREE.Mesh[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 5, 14)
    camera.lookAt(0, 7, -12)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x2f3440, roughness: 1 })
    )
    ground.rotation.x = -Math.PI / 2

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0x5c6579, roughness: 0.85 })
    const columns = pillars.map(([x, z, width, height]) => {
      const column = new THREE.Mesh(geometry, material)
      column.position.set(x, height / 2, z)
      column.scale.set(width, height, width)
      return column
    })

    meshesRef.current = [ground, ...columns]
    scene.add(...meshesRef.current)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      meshesRef.current.forEach((mesh) => {
        mesh.parent?.remove(mesh)
        mesh.geometry.dispose()
        const meshMaterial = mesh.material as THREE.Material
        meshMaterial.dispose()
      })
      meshesRef.current = []
    }
  }, [])

  return (
    <Scene
      rendererType={rendererType}
      bgColor="rgb(40, 42, 54)"
      gridHelper={{ size: 400, divisions: 40, colorGrid: 0x3a4050, colorCenterLine: 0x4d5570, y: 0.02 }}
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
      onCreated={handleCreated}
    >
      <HeightFog />
    </Scene>
  )
}
