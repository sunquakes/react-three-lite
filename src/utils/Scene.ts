import * as THREE from 'three'
import { PMREMGenerator as NodePMREMGenerator } from 'three/webgpu'
import { OrbitControls } from 'three-stdlib'
import CSS2DRenderer from './CSS2DRenderer'
import type { SceneComponents, CallbackFrame, R3LRenderer } from '../context/SceneContext'

export default async function (
  renderer: R3LRenderer,
  container: HTMLElement,
  components: SceneComponents,
  frame: CallbackFrame,
  beforeFrame?: CallbackFrame,
  afterFrame?: CallbackFrame
): Promise<{ scene: THREE.Scene; dispose: () => void }> {
  const camera = components.camera
  const scene = new THREE.Scene()

  if (components.light) {
    scene.add(components.light)
  }

  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight

  renderer.setSize(containerWidth, containerHeight)
  // WebGPURenderer requires an explicit init() before rendering.
  // WebGLRenderer does not have init; guard it to stay compatible with any
  // user-supplied WebGL renderer.
  if (typeof (renderer as unknown as { init?: () => Promise<unknown> }).init === 'function') {
    await (renderer as unknown as { init: () => Promise<unknown> }).init()
  }
  // Ensure consistent clear behavior across WebGL and WebGPU.
  // With alpha:true the default clear alpha is 0 (transparent).
  renderer.setClearColor(0x000000, 0)
  container.appendChild(renderer.domElement as HTMLElement)

  // Pass the main renderer through so CSS2DRenderer can detect the backend
  // coordinate system and correct the label translateY for WebGPU.
  const css2DRenderer = CSS2DRenderer(container, renderer)
  container.appendChild(css2DRenderer.domElement)
  renderer.autoClear = false

  // --- Default PBR environment ---------------------------------------------
  // PBR materials (MeshStandard / MeshPhysical, as produced by GLTF/FBX loaders)
  // rely on a scene-level environment to resolve their IBL reflection term.
  // Without an envMap, reflective/metallic surfaces appear completely black.
  //
  // Three r184 ships two PMREMGenerator implementations:
  //   - THREE.PMREMGenerator (three/src/extras/PMREMGenerator.js) — WebGL only
  //   - three/webgpu PMREMGenerator (renderers/common/extras/PMREMGenerator.js)
  //     — TSL/node-based, works with both WebGPU and WebGL-fallback backends.
  // We pick the correct one based on which renderer the user supplied.
  let defaultEnvTarget: THREE.WebGLRenderTarget | null = null
  try {
    const envScene = new THREE.Scene()
    envScene.background = new THREE.Color(0xcccccc)
    const hemi = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 5.0)
    envScene.add(hemi)

    const isNodeRenderer =
      (renderer as unknown as { isWebGPURenderer?: boolean }).isWebGPURenderer === true

    if (isNodeRenderer) {
      // Node-based PMREM — works directly with WebGPURenderer.
      const pmrem = new NodePMREMGenerator(renderer as unknown as ConstructorParameters<typeof NodePMREMGenerator>[0])
      defaultEnvTarget = pmrem.fromScene(envScene, 0.04) as unknown as THREE.WebGLRenderTarget
      scene.environment = defaultEnvTarget.texture
      pmrem.dispose()
    } else {
      // Legacy WebGLRenderer path — use the old PMREMGenerator.
      const pmrem = new THREE.PMREMGenerator(renderer as unknown as THREE.WebGLRenderer)
      pmrem.compileEquirectangularShader()
      defaultEnvTarget = pmrem.fromScene(envScene, 0.04)
      scene.environment = defaultEnvTarget.texture
      pmrem.dispose()
    }

    envScene.remove(hemi)
  } catch (err) {
    if (typeof console !== 'undefined' && (console as { warn?: (s: unknown) => void }).warn) {
      const msg = err instanceof Error ? err.message : String(err)
      ;(console as { warn: (s: unknown) => void }).warn(
        '[R3L] PMREMGenerator not available; default PBR environment skipped. Details: ' + msg
      )
    }
  }

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
        renderer.domElement.parentNode.removeChild(renderer.domElement as HTMLElement)
      }
      if (css2DRenderer.domElement.parentNode) {
        css2DRenderer.domElement.parentNode.removeChild(css2DRenderer.domElement)
      }
      // Drop the default environment so the render target can be released.
      if (scene.environment === (defaultEnvTarget?.texture ?? null)) {
        scene.environment = null
      }
      defaultEnvTarget?.dispose()
      defaultEnvTarget = null
      // Cleanup all objects in the scene
      scene.traverse((child: THREE.Object3D) => {
        const obj = child as THREE.Object3D & {
          geometry?: THREE.BufferGeometry
          material?: THREE.Material | THREE.Material[]
        }
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
