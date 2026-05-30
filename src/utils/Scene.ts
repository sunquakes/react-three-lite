import { WebGLRenderer, Scene, AxesHelper, GridHelper } from 'three'
import { OrbitControls } from 'three-stdlib'
import CSS2DRenderer from './CSS2DRenderer'
import type { SceneComponents, CallbackFrame } from '../context/SceneContext'

export default function (
  renderer: WebGLRenderer,
  container: HTMLElement,
  components: SceneComponents,
  frame: CallbackFrame,
  beforeFrame?: CallbackFrame,
  afterFrame?: CallbackFrame
): Scene {
  const camera = components.camera
  const scene = new Scene()
  
  if (components.light) {
    scene.add(components.light)
  }

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  renderer.setSize(containerWidth, containerHeight)
  container.appendChild(renderer.domElement)

  const css2DRenderer = CSS2DRenderer(container)
  container.appendChild(css2DRenderer.domElement)
  renderer.autoClear = false

  function animate() {
    beforeFrame?.(renderer, scene, components)
    if (components.controls instanceof OrbitControls) {
      components.controls.update()
    }
    frame(renderer, scene, components)
    if (camera) {
      css2DRenderer.render(scene, camera)
    }
    afterFrame?.(renderer, scene, components)
    requestAnimationFrame(animate)
  }
  animate()

  if (components.axesHelper instanceof AxesHelper) {
    scene.add(components.axesHelper)
  }

  if (components.gridHelper instanceof GridHelper) {
    scene.add(components.gridHelper)
  }

  function onWindowResize() {
    renderer.setSize(containerWidth, containerHeight)
    css2DRenderer.setSize(containerWidth, containerHeight)
  }

  window.addEventListener('resize', onWindowResize)
  return scene
}
