import { useCallback, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
import type { SceneComponents, WaterPoolOutline } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

// The pool depth scales with the water, so the surface stays 0.7 units deep.
const WATER_SCALE = 0.7

// The model is 0.86 x 0.74 x 1.64 units with its floor at y = 0, its rim at
// y = 0.53 and its inner opening 0.66 x 1.44 (no textures, about 3k triangles).
// These scales turn that opening into a 1.05 x 1.25 basin small enough to sit
// under the camera, and the height keeps the rim 9 cm above the surface.
const TUB_SCALE: [number, number, number] = [1.59, 1.15, 0.868]
const TUB_Y = 0.09 - 0.53 * TUB_SCALE[1]

// The water follows the tub opening with a 2 cm tuck under the porcelain, so
// the surface meets all four walls with no gap. The outline is in pool space,
// which WaterPool scales by WATER_SCALE.
const WATER_HALF_X = (0.33 * TUB_SCALE[0] + 0.02) / WATER_SCALE
const WATER_HALF_Z = (0.72 * TUB_SCALE[2] + 0.02) / WATER_SCALE
const WATER_OUTLINE: WaterPoolOutline = [
  [-WATER_HALF_X, -WATER_HALF_Z],
  [WATER_HALF_X, -WATER_HALF_Z],
  [WATER_HALF_X, WATER_HALF_Z],
  [-WATER_HALF_X, WATER_HALF_Z]
]

export default function App({ rendererType }: AppProps) {
  const skyRef = useRef<SkyDome | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components

    // A high sun keeps the refracted light crisp; every effect shares this
    // direction.
    globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

    camera.position.set(1.75, 2.2, 2.0)
    controls.target.set(0, 0, 0)
    camera.lookAt(0, 0, 0)

    // WaterPool draws the water only, so the sky and the sun come from SkyDome.
    // The palette matches the sky the water shader traces in its reflections.
    skyRef.current = new SkyDome({
      horizonColor: 0x94c2f0,
      lowerSkyColor: 0x7fb4ec,
      upperSkyColor: 0x3d7bd5,
      zenithColor: 0x296bc7,
      glowColor: 0xfff1d8,
      sunColor: 0xfff7e6,
      sunIntensity: 2.2,
      sunSize: 5
    })
    scene.add(skyRef.current)
  }

  // The loader component adds the tub to the scene; only its height needs
  // adjusting so the rim sits just above the surface all round.
  const handleTubLoaded = useCallback((tub: THREE.Group) => {
    tub.position.set(0, TUB_Y, 0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      skyRef.current?.dispose()
      skyRef.current = null
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
      <WaterPool shape={WATER_OUTLINE} scale={WATER_SCALE} />
      <GLTFLoader
        modelUrl="/models/water-tub.glb"
        useDraco={false}
        scale={TUB_SCALE}
        onLoaded={handleTubLoaded}
      />
    </Scene>
  )
}
