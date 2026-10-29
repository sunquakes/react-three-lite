import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, RadarSweep } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface RadarSweepProps {
  rendererType?: 'webgpu' | 'webgl'
}

// Gentle dune ripples shared by the ground mesh and the radar band, so the
// pulse visibly rides the terrain instead of slicing through it.
function terrainHeight(x: number, z: number): number {
  return Math.sin(x * 0.55) * 0.22 + Math.cos(z * 0.4) * 0.18
}

export default function RadarSweepComponent({ rendererType }: RadarSweepProps) {
  const sweepRef = useRef<RadarSweep | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 7, 10)
    camera.lookAt(0, 0, 0)

    // Displace the ground with the same sampler the sweep conforms to.
    const groundGeometry = new THREE.PlaneGeometry(22, 22, 96, 96)
    groundGeometry.rotateX(-Math.PI / 2)
    const positions = groundGeometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < positions.count; i += 1) {
      positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)))
    }
    groundGeometry.computeVertexNormals()

    const ground = new THREE.Mesh(
      groundGeometry,
      new THREE.MeshStandardMaterial({ color: 0x4a3a33, roughness: 1 })
    )
    scene.add(ground)
    groundRef.current = ground

    // `period` makes the sweep loop on its own; no animation loop required.
    const sweep = new RadarSweep({ radius: 8, heightAt: terrainHeight, period: 2.4 })
    scene.add(sweep)
    sweepRef.current = sweep
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sweepRef.current?.dispose()
      sweepRef.current = null

      const ground = groundRef.current
      if (ground) {
        ground.parent?.remove(ground)
        ground.geometry.dispose()
        ;(ground.material as THREE.Material).dispose()
      }
      groundRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
