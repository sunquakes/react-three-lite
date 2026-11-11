import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function App({ rendererType }: AppProps) {
  const tubRef = useRef<THREE.Group | null>(null)
  const cancelledRef = useRef(false)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components

    // A high sun keeps the caustics sharp; every effect shares this direction.
    globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

    camera.position.set(1.5, 1.1, 2.0)
    controls.target.set(0, -0.1, 0)
    camera.lookAt(0, -0.1, 0)

    const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
    if (cancelledRef.current) {
      disposeModel(tub)
      return
    }

    // The model is 0.86 x 0.53 x 1.64 units with its floor at y = 0 and has no
    // textures (about 3k triangles), so it stays cheap to keep in memory.
    // Stretch it over the 2 x 2 water and drop it by one unit: the rim sits just
    // above the surface and the inner walls cut into the water, so no dry gap
    // is left between the water edge and the tub.
    tub.scale.set(2.7, 1.92, 1.28)
    tub.position.set(0, -1, 0)
    scene.add(tub)
    tubRef.current = tub
  }

  // Cleanup on unmount
  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      if (tubRef.current) {
        disposeModel(tubRef.current)
        tubRef.current = null
      }
    }
  }, [])

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      bgColor="rgb(40, 42, 54)"
      axesHelper={false}
      gridHelper={false}
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      <WaterPool />
    </Scene>
  )
}
