import * as THREE from 'three'
import { Scene, GeoJsonLayer } from 'react-three-lite'
import type { GeoJsonData, GeoJsonStyle, SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

const ORIGIN = { lng: 116.397, lat: 39.909 }

// City-scale grid options; Scene builds the GridHelper and disposes it on unmount.
const GRID = { size: 1200, divisions: 24, colorCenterLine: 0x4a6fa5, colorGrid: 0x2f3e5c }

const data: GeoJsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'park' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [116.395, 39.9095],
            [116.399, 39.9095],
            [116.399, 39.9115],
            [116.395, 39.9115],
            [116.395, 39.9095]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: { kind: 'block' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [116.3972, 39.9068],
            [116.3992, 39.9068],
            [116.3992, 39.9084],
            [116.3972, 39.9084],
            [116.3972, 39.9068]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [116.394, 39.9075],
          [116.4005, 39.9075],
          [116.4005, 39.9125]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Point',
        coordinates: [116.397, 39.909]
      }
    }
  ]
}

const COLORS: Record<string, GeoJsonStyle> = {
  park: { fillColor: 0x4caf50, strokeColor: 0xb9f6ca, opacity: 0.7 },
  block: { fillColor: 0xff7043, strokeColor: 0xffab91, opacity: 0.7 }
}

export default function App({ rendererType }: AppProps) {
  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    // A fixed south-side viewpoint looks north over the dataset; the scene
    // places the camera from local metres and it looks back at the origin,
    // so the view stays north-up.
    scene.setPosition(camera, { x: 0, y: 500, z: 700 })
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
      <GeoJsonLayer
        data={data}
        style={{ strokeColor: 0x9fd0ff, pointColor: 0xffd166, pointSize: 40 }}
        featureStyle={(feature) => {
          const kind = feature.properties?.kind
          return typeof kind === 'string' ? COLORS[kind] : undefined
        }}
      />
    </Scene>
  )
}
