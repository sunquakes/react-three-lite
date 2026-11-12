import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoaderAsync, Scene, WaterPool, disposeModel, globalParameterBus } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

// The tub is 1.19 x 0.56 units with its rim at y = 0.35 and its floor at y = 0.
const TUB_SCALE = 1.7
// The outline is normalised by half of the rim opening (0.536 units), so the
// pool scale is that half extent in world units and the water depth matches it.
const WATER_SCALE = 0.536 * TUB_SCALE
const WATER_Y = 0.33 * TUB_SCALE

// Top view of the bathtub opening: a long rounded rectangle that follows the
// inner rim. The water uses the same outline, so it reaches the walls all round.
const TUB_OUTLINE: [number, number][] = [
  [-1, 0],
  [-0.987, -0.106],
  [-0.945, -0.207],
  [-0.879, -0.291],
  [-0.795, -0.358],
  [-0.694, -0.399],
  [-0.588, -0.412],
  [0.513, -0.412],
  [0.619, -0.399],
  [0.72, -0.358],
  [0.804, -0.291],
  [0.871, -0.207],
  [0.981, -0.028],
  [0.981, 0.028],
  [0.871, 0.207],
  [0.804, 0.291],
  [0.72, 0.358],
  [0.619, 0.399],
  [0.513, 0.412],
  [-0.588, 0.412],
  [-0.694, 0.399],
  [-0.795, 0.358],
  [-0.879, 0.291],
  [-0.945, 0.207],
  [-0.987, 0.106]
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
    camera.position.set(1.7, 1.35, 1.9)
    controls.target.set(0, 0.3, 0)
    camera.lookAt(0, 0.3, 0)

    const tub = await GLTFLoaderAsync('/models/bathtub.glb', false)
    if (cancelledRef.current) {
      disposeModel(tub)
      return
    }

    // The model has its origin in a corner, so shift it back over the water.
    tub.scale.setScalar(TUB_SCALE)
    tub.position.set(-0.595 * TUB_SCALE, 0, 0.28 * TUB_SCALE)
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
      <WaterPool
        shape={TUB_OUTLINE}
        scale={WATER_SCALE}
        position={[0, WATER_Y, 0]}
      />
    </Scene>
  )
}
