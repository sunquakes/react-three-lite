import { useState, useEffect, useCallback } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

type GLTFLoaderType = typeof import('react-three-lite')['GLTFLoader']

interface GLTFLoaderComponentProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function GLTFLoaderComponentComponent({ rendererType }: GLTFLoaderComponentProps) {
  const [GLTFLoader, setGLTFLoader] = useState<GLTFLoaderType | null>(null)

  useEffect(() => {
    import('react-three-lite').then((module) => {
      setGLTFLoader(() => module.GLTFLoader)
    })
  }, [])

  const handleCreated = useCallback((scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1.5, 3)
  }, [])

  return (
    <Scene rendererType={rendererType} style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden' }} bgColor="#1a1a2e" onCreated={handleCreated}>
      {GLTFLoader && <GLTFLoader modelUrl="/models/perseverance-draco.glb" scale={[0.8, 0.8, 0.8]} useDraco />}
    </Scene>
  )
}
