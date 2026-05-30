import { useState, useEffect, useCallback } from 'react'
import { Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function OBJLoaderFunctionComponent() {
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
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated}>
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
