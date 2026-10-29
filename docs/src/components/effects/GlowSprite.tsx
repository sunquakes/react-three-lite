import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, GlowSprite } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface GlowSpriteProps {
  rendererType?: 'webgpu' | 'webgl'
}

interface DotConfig {
  position: [number, number, number]
  size: number
  color: number
  tint: number
  opacity: number
  /** Optional self-pulse: seconds per breathing cycle */
  pulsePeriod?: number
  /** Optional pulse phase offset in the 0-1 range */
  phase?: number
}

// A handful of glowing dots at different scales: the pale blue Earth and two
// fainter stars, one of them pulsing like a beacon — no animation loop needed.
const dots: DotConfig[] = [
  { position: [0, 1, 0], size: 3.2, color: 0x8ecbff, tint: 0xbcdfff, opacity: 0.9 },
  { position: [-3.4, -0.8, -2], size: 1.4, color: 0xffb066, tint: 0xffd9a8, opacity: 0.8, pulsePeriod: 2.2, phase: 0.3 },
  { position: [3.6, 2.4, -4], size: 2.2, color: 0x9ce8ff, tint: 0xd8f4ff, opacity: 0.85 }
]

export default function GlowSpriteComponent({ rendererType }: GlowSpriteProps) {
  const dotsRef = useRef<GlowSprite[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 0.8, 7)
    camera.lookAt(0, 0.8, 0)

    dots.forEach((dot) => {
      const sprite = new GlowSprite({
        size: dot.size,
        color: dot.color,
        tint: dot.tint,
        opacity: dot.opacity,
        pulsePeriod: dot.pulsePeriod,
        phase: dot.phase
      })
      sprite.position.set(...dot.position)
      scene.add(sprite)
      dotsRef.current.push(sprite)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dotsRef.current.forEach((sprite) => sprite.dispose())
      dotsRef.current = []
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(8, 10, 20)" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
