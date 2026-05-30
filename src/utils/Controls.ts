import { PerspectiveCamera, WebGLRenderer, Vector3 } from 'three'
import { OrbitControls } from 'three-stdlib'

export default function (camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls {
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target = new Vector3(0, 0, 0)
  return controls
}
