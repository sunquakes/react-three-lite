import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import CSS2DRenderer from './CSS2DRenderer'
import type { SceneComponents, CallbackFrame } from '../context/SceneContext'

export default function (
  renderer: THREE.WebGLRenderer,
  container: HTMLElement,
  components: SceneComponents,
  frame: CallbackFrame,
  beforeFrame?: CallbackFrame,
  afterFrame?: CallbackFrame
): { scene: THREE.Scene; dispose: () => void } {
  const camera = components.camera
  const scene = new THREE.Scene()
  
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

  if (components.axesHelper instanceof THREE.AxesHelper) {
    scene.add(components.axesHelper)
  }

  if (components.gridHelper instanceof THREE.GridHelper) {
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
      scene.traverse((child: THREE.Object3D) => {
        const obj = child as THREE.Object3D & { geometry?: THREE.BufferGeometry; material?: THREE.Material | THREE.Material[] }
        if (obj.geometry) {
          obj.geometry.dispose()
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
  }
}
