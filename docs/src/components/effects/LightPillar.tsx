import { useRef, useEffect } from 'react'
import { Scene, LightPillar } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface LightPillarProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function LightPillarComponent({ rendererType }: LightPillarProps) {
  const pillarsRef = useRef<LightPillar[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 2.4, 6)
    camera.lookAt(0, 1, 0)

    const pillars: { x: number; z: number; value: number; color: number }[] = [
      { x: -2.2, z: 0, value: 0.35, color: 0x00ffff },
      { x: 0, z: -0.6, value: 1, color: 0x36e0a0 },
      { x: 2.2, z: 0, value: 0.62, color: 0xffb347 }
    ]

    pillars.forEach(({ x, z, value, color }) => {
      const pillar = new LightPillar({
        color,
        // Map a normalized data value to the pillar height
        height: 1 + value * 2.4,
        radius: 0.22
      })
      pillar.position.set(x, 0, z)
      scene.add(pillar)
      pillarsRef.current.push(pillar)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pillarsRef.current.forEach((pillar) => pillar.dispose())
      pillarsRef.current = []
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="#1a1a2e" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
