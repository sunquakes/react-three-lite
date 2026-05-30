import { useState, useEffect, useCallback } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function FBXLoaderFunctionComponent() {
  const [FBXLoader, setFBXLoader] = useState<any>(null)

  useEffect(() => {
    import('react-three-lite').then((module) => {
      setFBXLoader(() => module.FBXLoader)
    })
  }, [])

  const handleCreated = useCallback((scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1.5, 3)
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated}>
      {FBXLoader && <FBXLoader modelUrl="/models/perseverance.fbx" scale={[0.8, 0.8, 0.8]} />}
    </Scene>
  )
}
