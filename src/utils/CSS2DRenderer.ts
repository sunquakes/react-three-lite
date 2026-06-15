import { CSS2DRenderer } from 'three-stdlib'

export default function (container: HTMLElement): typeof CSS2DRenderer.prototype {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const renderer = new CSS2DRenderer()
  renderer.setSize(containerWidth, containerHeight)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.pointerEvents = 'none'
  return renderer
}
