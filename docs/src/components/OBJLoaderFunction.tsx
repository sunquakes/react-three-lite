import { useCallback } from 'react'
import { Scene, OBJLoaderAsync } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'
import type * as THREE from 'three'

export default function OBJLoaderFunctionComponent() {
  const handleCreated = useCallback(async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 1.5, 3)
    camera.lookAt(0, 0, 0)

    const model = await OBJLoaderAsync('/models/obj/perseverance.obj', '/models/obj/perseverance.mtl')
    model.scale.set(0.8, 0.8, 0.8)
    scene.add(model)
  }, [])

  return (
    <Scene style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} bgColor="#1a1a2e" onCreated={handleCreated}>
    </Scene>
  )
}
