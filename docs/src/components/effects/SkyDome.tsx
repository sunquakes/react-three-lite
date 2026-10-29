import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, SkyDome } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface SkyDomeProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function SkyDomeComponent({ rendererType }: SkyDomeProps) {
  const skyRef = useRef<SkyDome | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components

    camera.position.set(0, 0.8, 7)
    camera.lookAt(0, 0.8, 0)

    skyRef.current = new SkyDome()
    scene.add(skyRef.current)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      skyRef.current?.dispose()
      skyRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
