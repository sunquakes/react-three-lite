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
): { scene: Scene; dispose: () => void } {
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

  let animationId: number
  let disposed = false

  function animate() {
    if (disposed) return
    beforeFrame?.(renderer, scene, components)
    if (components.controls instanceof OrbitControls) {
      components.controls.update()
    }
    frame(renderer, scene, components)
    if (camera) {
      css2DRenderer.render(scene, camera)
    }
    afterFrame?.(renderer, scene, components)
    animationId = requestAnimationFrame(animate)
  }
  animate()

  if (components.axesHelper instanceof AxesHelper) {
    scene.add(components.axesHelper)
  }

  if (components.gridHelper instanceof GridHelper) {
    scene.add(components.gridHelper)
  }

  function onWindowResize() {
    renderer.setSize(container.clientWidth, container.clientHeight)
    css2DRenderer.setSize(container.clientWidth, container.clientHeight)
  }

  window.addEventListener('resize', onWindowResize)

  return {
    scene,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onWindowResize)
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      if (css2DRenderer.domElement.parentNode) {
        css2DRenderer.domElement.parentNode.removeChild(css2DRenderer.domElement)
      }
      // 清理场景中的所有对象
      scene.traverse((child) => {
        if ('geometry' in child) {
          (child as any).geometry?.dispose()
        }
        if ('material' in child) {
          const material = (child as any).material
          if (Array.isArray(material)) {
            material.forEach((m: any) => m?.dispose())
          } else {
            material?.dispose()
          }
        }
        if ('dispose' in child && typeof (child as any).dispose === 'function') {
          (child as any).dispose()
        }
      })
    }
  }
}
