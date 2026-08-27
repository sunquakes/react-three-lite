import { PerspectiveCamera } from 'three'

export default function (container: HTMLElement): PerspectiveCamera {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  // Guard against a zero-size container (e.g. a scene mounted inside a hidden
  // tab) so the aspect ratio never becomes Infinity/NaN.
  const aspect = containerWidth > 0 && containerHeight > 0 ? containerWidth / containerHeight : 1
  const camera = new PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(0, 0, 1)
  camera.lookAt(0, 0, 0)
  return camera
}
