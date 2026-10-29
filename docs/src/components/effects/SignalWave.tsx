import { useRef, useEffect } from 'react'
import { Scene, SignalWave } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface SignalWaveProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function SignalWaveComponent({ rendererType }: SignalWaveProps) {
  const wavesRef = useRef<SignalWave | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 3.2, 11)
    camera.lookAt(0, 5, 0)

    // `travel` makes the pulses climb the bearing on their own and `count`
    // spreads six of them out in phase; no animation loop required.
    const waves = new SignalWave({
      bearing: [0.24, 1, 0],
      travel: 26,
      period: 26 / 7,
      count: 6,
      startScale: 0.45,
      endScale: 3.4
    })
    scene.add(waves)
    wavesRef.current = waves
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wavesRef.current?.dispose()
      wavesRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
