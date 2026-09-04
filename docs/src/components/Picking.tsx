import { useRef } from 'react'
import * as THREE from 'three'
import { Scene } from 'react-three-lite'
import type { SceneComponents, PickEvent } from 'react-three-lite'

interface PickingProps {
  rendererType?: 'webgpu' | 'webgl'
}

const COLORS = [0x4fc3f7, 0x81c784, 0xffb74d, 0xe57373, 0xba68c8, 0x4db6ac]
const POSITIONS: [number, number, number][] = [
  [-3, 0, 0],
  [-1.8, 0, 0],
  [-0.6, 0, 0],
  [0.6, 0, 0],
  [1.8, 0, 0],
  [3, 0, 0],
]

export default function PickingComponent({ rendererType }: PickingProps) {
  const hoveredRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return
    camera.position.set(0, 1, 6)
    camera.lookAt(0, 0, 0)

    POSITIONS.forEach((pos, i) => {
      const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8)
      const material = new THREE.MeshStandardMaterial({ color: COLORS[i] })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...pos)
      scene.add(mesh)
    })
  }

  const handleClick = (event: PickEvent | null) => {
    if (!event) return
    const material = (event.object as THREE.Mesh).material as THREE.MeshStandardMaterial
    material.color.setHex(Math.random() * 0xffffff)
  }

  const handleHover = (event: PickEvent | null) => {
    const previous = hoveredRef.current
    if (previous) {
      const material = previous.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x000000)
    }

    const mesh = event ? (event.object as THREE.Mesh) : null
    if (mesh) {
      const material = mesh.material as THREE.MeshStandardMaterial
      material.emissive.setHex(0x444444)
    }
    hoveredRef.current = mesh
  }

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      onClick={handleClick}
      onHover={handleHover}
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    />
  )
}