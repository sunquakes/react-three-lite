import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Scene, Snow } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface SnowProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function SnowComponent({ rendererType }: SnowProps) {
  const objectsRef = useRef<THREE.Object3D[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return
    camera.position.set(0, 1.6, 6)
    camera.lookAt(0, -0.2, 0)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: '#39404f', roughness: 1 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.4

    const rock = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 48, 32),
      new THREE.MeshStandardMaterial({ color: '#4c566a', roughness: 0.85 })
    )
    rock.position.set(-1.6, -0.5, -0.4)
    rock.scale.set(1, 0.8, 1)

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.5, 1.5),
      new THREE.MeshStandardMaterial({ color: '#434c5e', roughness: 0.9 })
    )
    block.position.set(1.5, -0.65, -0.6)
    block.rotation.y = Math.PI / 6

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.6, 32),
      new THREE.MeshStandardMaterial({ color: '#3f4657', roughness: 0.9 })
    )
    pillar.position.set(0.2, -0.6, -1.8)

    scene.add(ground, rock, block, pillar)
    objectsRef.current = [ground, rock, block, pillar]
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      objectsRef.current.forEach((object) => {
        const mesh = object as THREE.Mesh
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
        mesh.removeFromParent()
      })
      objectsRef.current = []
    }
  }, [])

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      bgColor="rgb(40, 42, 54)"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      <Snow
        count={1200}
        speed={0.5}
        color={0xffffff}
        range={16}
        height={14}
        windX={0.2}
        windZ={0.08}
        accumulate
        accumulationThickness={0.12}
        accumulationDuration={6}
      />
    </Scene>
  )
}
