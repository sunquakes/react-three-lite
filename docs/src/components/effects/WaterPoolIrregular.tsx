import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

// The tub is 1.2 x 1.2 units with its floor at y = 0 and a rim at y = 0.55.
const TUB_SCALE = 1.5
const WATER_Y = 0.55 * TUB_SCALE - 0.02

// Top view of the corner bathtub rim: a square back with a curved front. The
// water uses the same outline, so it fills the tub right up to the rim.
const TUB_OUTLINE: [number, number][] = [
  [-0.6, -0.6],
  [0.6, -0.6],
  [0.59, -0.443],
  [0.559, -0.289],
  [0.509, -0.141],
  [0.439, 0],
  [0.352, 0.131],
  [0.249, 0.249],
  [0.131, 0.352],
  [0, 0.439],
  [-0.141, 0.509],
  [-0.289, 0.559],
  [-0.443, 0.59],
  [-0.6, 0.6]
]

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function App({ rendererType }: AppProps) {
  const tubRef = useRef<THREE.Group | null>(null)
  const cancelledRef = useRef(false)

  const handleCreated = async (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components
    globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
    camera.position.set(1.6, 1.4, 1.9)
    controls.target.set(0, 0.35, 0)
    camera.lookAt(0, 0.35, 0)

    const tub = await GLTFLoaderAsync('/models/water-tub-corner.glb', false)
    if (cancelledRef.current) {
      disposeModel(tub)
      return
    }

    tub.scale.setScalar(TUB_SCALE)
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
      <WaterPool shape={TUB_OUTLINE} scale={TUB_SCALE} position={[0, WATER_Y, 0]} />
    </Scene>
  )
}
