import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, Fireworks } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface FireworksProps {
  rendererType?: 'webgpu' | 'webgl'
}

interface ShellConfig {
  color: number
  height: number
  scale: number
  offset: [number, number, number]
  launchDuration: number
  burstDuration: number
}

// A small scripted show: each shell differs in color, burst height, spread,
// screen position and phase lengths so the shells desynchronise and keep
// popping instead of firing in a single synchronized volley.
const shells: ShellConfig[] = [
  { color: 0xffd4a0, height: 6.6, scale: 3.6, offset: [-3.6, 0, -1.5], launchDuration: 1.25, burstDuration: 1.9 },
  { color: 0xff6b6b, height: 7.4, scale: 3.2, offset: [3.2, 0, -0.8], launchDuration: 1.5, burstDuration: 2.2 },
  { color: 0x7ad7ff, height: 5.9, scale: 3.9, offset: [-1.4, 0, 1.6], launchDuration: 1.7, burstDuration: 1.6 },
  { color: 0xffe14d, height: 8.1, scale: 3.1, offset: [1.8, 0, -2.4], launchDuration: 1.35, burstDuration: 2.4 },
  { color: 0xb98bff, height: 6.9, scale: 3.5, offset: [-4.4, 0, 1.2], launchDuration: 1.6, burstDuration: 1.8 },
  { color: 0x66ffb2, height: 7.7, scale: 3.3, offset: [4.1, 0, 1.8], launchDuration: 1.2, burstDuration: 2.1 },
  { color: 0xffffff, height: 6.2, scale: 3.8, offset: [0.2, 0, 0.4], launchDuration: 1.45, burstDuration: 1.7 },
  { color: 0xff8ad4, height: 8.4, scale: 3.0, offset: [-2.6, 0, -2.8], launchDuration: 1.75, burstDuration: 2.3 },
  { color: 0xffa54d, height: 7.1, scale: 3.4, offset: [2.7, 0, 2.6], launchDuration: 1.3, burstDuration: 1.95 },
  { color: 0x8ab4ff, height: 6.8, scale: 3.7, offset: [-0.9, 0, -1.1], launchDuration: 1.55, burstDuration: 2.05 }
]

export default function FireworksComponent({ rendererType }: FireworksProps) {
  const fireworksRef = useRef<Fireworks[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 6, 17)
    camera.lookAt(0, 6, 0)

    shells.forEach((shell) => {
      const fireworks = new Fireworks({
        color: shell.color,
        burstHeight: shell.height,
        burstScale: shell.scale,
        burstPositionOffset: new THREE.Vector3(...shell.offset),
        launchDuration: shell.launchDuration,
        burstDuration: shell.burstDuration,
        loop: true
      })
      scene.add(fireworks)
      fireworksRef.current.push(fireworks)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      fireworksRef.current.forEach((fireworks) => fireworks.dispose())
      fireworksRef.current = []
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="#1a1a2e" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
