import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Scene } from 'react-three-lite'
import type { GeoPoint, SceneComponents } from 'react-three-lite'

interface AppProps {
  rendererType?: 'webgpu' | 'webgl'
}

// Tiananmen Square, Beijing (WGS84).
const ORIGIN: GeoPoint = { lng: 116.397, lat: 39.909 }

// City-scale grid options; Scene builds the GridHelper and disposes it on unmount.
const GRID = { size: 1200, divisions: 24, colorCenterLine: 0x4a6fa5, colorGrid: 0x2f3e5c }

// Nearby landmarks expressed as raw geographic coordinates.
const PLACES: { point: GeoPoint; color: number }[] = [
  { point: ORIGIN, color: 0xffd166 },
  { point: { lng: 116.4005, lat: 39.909 }, color: 0x4fc3f7 },
  { point: { lng: 116.397, lat: 39.9117 }, color: 0x81c784 },
  { point: { lng: 116.3935, lat: 39.9063 }, color: 0xe57373 }
]

export default function App({ rendererType }: AppProps) {
  const objectsRef = useRef<THREE.Object3D[]>([])

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    // A raised south-side viewpoint looks north over the landmarks; the scene
    // places the camera from local metres and it looks back at the origin.
    scene.setPosition(camera, { x: 0, y: 500, z: 700 })
    camera.lookAt(0, 0, 0)

    PLACES.forEach(({ point, color }) => {
      const radius = 35
      const geometry = new THREE.SphereGeometry(radius, 24, 16)
      const material = new THREE.MeshBasicMaterial({ color })
      const marker = new THREE.Mesh(geometry, material)
      // The scene carries its own GeoReference, so it projects the point itself.
      // A [lng, lat, alt] tuple works here exactly like the {lng, lat} object.
      scene.setPosition(marker, point)
      // Rest the sphere on the ground plane instead of burying its lower half.
      marker.position.y = radius
      scene.add(marker)
      objectsRef.current.push(marker)
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      objectsRef.current.forEach((object) => {
        object.removeFromParent()
        const mesh = object as THREE.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as THREE.Material | undefined
        material?.dispose()
      })
      objectsRef.current = []
    }
  }, [])

  return (
    <Scene
      rendererType={rendererType}
      origin={ORIGIN}
      gridHelper={GRID}
      onCreated={handleCreated}
      bgColor="rgb(40, 42, 54)"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    />
  )
}
