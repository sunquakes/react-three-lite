import { useState, useEffect, useCallback } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

interface OBJLoaderComponentProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function OBJLoaderComponentComponent({ rendererType }: OBJLoaderComponentProps) {
  const [OBJLoader, setOBJLoader] = useState<any>(null)

  useEffect(() => {
    import('react-three-lite').then((module) => {
      setOBJLoader(() => module.OBJLoader)
    })
  }, [])

  const handleCreated = useCallback((scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1.5, 3)
  }, [])

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }} bgColor="#1a1a2e" onCreated={handleCreated}>
      {OBJLoader && (
        <OBJLoader
          modelUrl="/models/obj/perseverance.obj"
          mtlUrl="/models/obj/perseverance.mtl"
          scale={[0.8, 0.8, 0.8]}
        />
      )}
    </Scene>
  )
}
