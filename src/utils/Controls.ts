import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import type { R3LRenderer } from '../context/SceneContext'

export default function (camera: THREE.PerspectiveCamera, renderer: R3LRenderer): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement as HTMLElement)
  controls.target = new THREE.Vector3(0, 0, 0)
  return controls
}
