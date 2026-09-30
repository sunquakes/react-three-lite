import * as THREE from 'three'
import { Scene, TileLayer, GeoObject } from 'react-three-lite'
import type { GeoPoint, SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

// WGS84 (GPS standard) point near Suzhou; used both as the local origin and the pin anchor.
const PIN: GeoPoint = { lng: 120.60682, lat: 31.330898 }
const ORIGIN = PIN

// AMap (Gaode) raster tiles are indexed in GCJ02 coordinates. Its CDN answers
// the initial tile burst reliably from this network, unlike
// tile.openstreetmap.org, which rate-limits bulk GET requests to timeouts.
const TILE_URL =
  'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
const TILE_SUBDOMAINS = ['1', '2', '3', '4']
// AMap's max zoom for this style; zooming in past level 15 then streams
// genuinely finer tiles instead of reusing the cached level-15 imagery.
const TILE_ZOOM = 17

// GeoObject creates an internal Group and disposes its meshes on unmount.
const decoratePin = (anchor: THREE.Object3D) => {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(40, 120, 24),
    new THREE.MeshBasicMaterial({ color: 0xff3b30 })
  )
  // Cone is 120 tall and centred on its midpoint; lift it so the base sits on the ground.
  cone.position.y = 60
  anchor.add(cone)
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    // A fixed south-side viewpoint keeps the raster map readable like a
    // conventional map. The scene projects the camera itself, so the position
    // is just local metres; looking north from due south keeps it north-up.
    // The 45-degree depression keeps every frustum corner ray on the ground,
    // so the whole frame stays on the map: with the 75-degree fov, a steeper
    // tilt pushes the bottom edge past the zenith (a sky band at the bottom)
    // and a shallower one lifts the top edge past the horizon (background sky
    // at the top).
    scene.setPosition(camera, { x: 0, y: 450, z: 450 })
    camera.lookAt(0, 0, 0)
  }

  return (
    <Scene
      rendererType={rendererType}
      origin={ORIGIN}
      gridHelper={false}
      onCreated={handleCreated}
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      <TileLayer url={TILE_URL} zoom={TILE_ZOOM} datum="GCJ02" subdomains={TILE_SUBDOMAINS} />
      <GeoObject coordinate={PIN} datum="WGS84" onReady={decoratePin} />
    </Scene>
  )
}
