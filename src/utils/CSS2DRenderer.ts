import { CSS2DRenderer as UpstreamCSS2DRenderer } from 'three-stdlib'
import * as THREE from 'three'

/**
 * The upstream CSS2DRenderer from three-stdlib always assumes the WebGL
 * projection convention: after applying the viewProjection matrix the NDC
 * Y axis points UP (y=+1 is top of viewport, y=-1 is bottom). Its element
 * placement formula is therefore:
 *
 *     translateY = -_vector.y * heightHalf + heightHalf
 *
 * `WebGPURenderer` flips the clip-space Y axis so the SAME post-projection
 * y=+1 value now maps to the BOTTOM of the viewport. As a result the
 * upstream formula renders CSS2D labels MIRRORED vertically around the
 * viewport center whenever a WebGPU backend is used.
 *
 * This wrapper:
 *   1. Creates the upstream CSS2DRenderer normally
 *   2. Wraps its `render()` method. After the upstream method positions every
 *      CSS2DObject DOM element with the WebGL-style transform we post-process
 *      every element and REWRITE its translateY to the WebGPU-style value
 *      (flip the sign on the y-component) whenever the attached main
 *      renderer reports `coordinateSystem === THREE.WebGPUCoordinateSystem`.
 *
 * The wrapper also supports WebGL (or any non-flipped backend) transparently:
 * when coordinateSystem is not WebGPU the post-process is a no-op.
 */
export default function (
  container: HTMLElement,
  mainRenderer?: { coordinateSystem?: number } | null
): InstanceType<typeof UpstreamCSS2DRenderer> {
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const renderer = new UpstreamCSS2DRenderer()
  renderer.setSize(containerWidth, containerHeight)
  renderer.domElement.style.position = 'absolute'
  renderer.domElement.style.top = '0'
  renderer.domElement.style.pointerEvents = 'none'

  const webgpu = mainRenderer?.coordinateSystem === THREE.WebGPUCoordinateSystem
  void containerHeight

  if (webgpu) {
    const originalRender = renderer.render.bind(renderer)
    const regex = /translate\((-?\d+(?:\.\d+)?%(?:,-?\d+(?:\.\d+)?%)?)\)translate\((-?\d+(?:\.\d+)?)px,(-?\d+(?:\.\d+)?)px\)/

    renderer.render = function (scene: THREE.Scene, camera: THREE.Camera) {
      originalRender(scene, camera)

      // Walk every CSS2DObject and flip its translateY. We do it by rewriting
      // the transform string produced by the upstream renderer so we stay
      // compatible with any future changes to its format while only touching
      // the one numeric field we care about (the y pixel offset).
      const stack: THREE.Object3D[] = [scene]
      while (stack.length) {
        const obj = stack.pop()!
        // isCSS2DObject is tagged by three-stdlib at runtime; read it loosely.
        if ((obj as unknown as { isCSS2DObject?: boolean; element?: HTMLElement }).isCSS2DObject) {
          const element = (obj as unknown as { element: HTMLElement }).element
          const match = element.style.transform.match(regex)
          if (match) {
            const centerTranslate = match[1] // e.g. "0%,-100%"
            const xPx = match[2]
            const yPx = parseFloat(match[3])
            // Mirror the y pixel offset around the viewport center.
            // upstream  y = -ndcY*half + half  (WebGL)
            // desired   y' =  ndcY*half + half  (WebGPU)
            // => y' = height - y
            const h = (renderer as unknown as { getSize: () => { height: number } }).getSize().height
            const flippedY = h - yPx
            element.style.transform = `translate(${centerTranslate})translate(${xPx}px,${flippedY.toFixed(3)}px)`
          }
        }
        for (let i = 0; i < obj.children.length; i++) {
          stack.push(obj.children[i])
        }
      }
    }
  }

  return renderer
}
