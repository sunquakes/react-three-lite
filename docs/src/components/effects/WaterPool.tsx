import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

// The default pool is an irregular cube outline that spans 1.82 units at
// scale 1, so this scale keeps the water just inside the 1.28 unit tub
// opening. The depth scales with it.
const WATER_SCALE = 0.7

// The model is 0.86 x 0.74 x 1.64 units with its floor at y = 0, its rim at
// y = 0.53 and its inner opening 0.66 x 1.44 (no textures, about 3k triangles).
// These scales stretch that opening into the square the tub encloses, and the
// height keeps the rim 9 cm above the surface so the tub stays readable.
const TUB_SCALE = new THREE.Vector3(1.94, 1.3, 0.89)
const TUB_Y = -0.598

export default function App({ rendererType }: AppProps) {
  const tubRef = useRef<THREE.Group | null>(null)
  const cancelledRef = useRef(false)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components

    // A high sun keeps the refracted light crisp; every effect shares this
    // direction.
    globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

    camera.position.set(1.75, 2.2, 2.0)
    controls.target.set(0, 0, 0)
    camera.lookAt(0, 0, 0)

    const tub = await GLTFLoaderAsync('/models/water-tub.glb', false)
    if (cancelledRef.current) {
      disposeModel(tub)
      return
    }

    // The tub is only the visual container: the irregular cube sits inside its
    // opening, so the rim stays just above the surface all round.
    tub.scale.copy(TUB_SCALE)
    tub.position.set(0, TUB_Y, 0)
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
      <WaterPool scale={WATER_SCALE} />
    </Scene>
  )
}
