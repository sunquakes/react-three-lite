import * as THREE from 'three'
import { Scene, GeoObject } from 'react-three-lite'
import type { GeoPoint, SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

// Scene origin in WGS84; anchored markers below are GCJ02 coordinates as
// returned by Chinese map services such as AMap or Tencent.
const ORIGIN: GeoPoint = { lng: 116.391, lat: 39.907 }

// City-scale grid options; Scene builds the GridHelper and disposes it on unmount.
const GRID = { size: 1400, divisions: 28, colorCenterLine: 0x4a6fa5, colorGrid: 0x2f3e5c }

// GCJ02 ("Mars") coordinates near Tiananmen Square.
const MARKERS: GeoPoint[] = [
  { lng: 116.397428, lat: 39.90923 },
  { lng: 116.4005, lat: 39.9117 },
  { lng: 116.3945, lat: 39.912 }
]

function decorate(object: THREE.Object3D): void {
  const geometry = new THREE.ConeGeometry(40, 120, 24)
  const material = new THREE.MeshBasicMaterial({ color: 0xffd166 })
  const cone = new THREE.Mesh(geometry, material)
  cone.position.y = 60
  object.add(cone)
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    // A raised south-side viewpoint looks north over the markers; the scene
    // places the camera from local metres and it looks back at the origin.
    scene.setPosition(camera, { x: 0, y: 750, z: 1000 })
    camera.lookAt(0, 0, 0)
  }

  return (
    <Scene
      rendererType={rendererType}
      origin={ORIGIN}
      gridHelper={GRID}
      onCreated={handleCreated}
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      {MARKERS.map((coordinate, index) => (
        <GeoObject key={index} coordinate={coordinate} datum="GCJ02" onReady={decorate} />
      ))}
    </Scene>
  )
}
