import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'
import { generateUUID } from '../utils/UUID'
import createScene from '../utils/Scene'
import CameraUtil from '../utils/Camera'
import LightUtil from '../utils/Light'
import Renderer, { RendererType } from '../utils/Renderer'
import AxesHelperUtil from '../utils/AxesHelper'
import Controls from '../utils/Controls'
import {
  SceneContext,
  SceneComponents,
  CallbackFrame,
  SceneSlotProps,
  R3LRenderer
} from '../context/SceneContext'

interface SceneProps {
  modelValue?: THREE.Scene
  renderer?: R3LRenderer
  rendererType?: RendererType
  bgColor?: string
  bgImage?: string
  camera?: THREE.PerspectiveCamera
  light?: THREE.Object3D
  axesHelper?: THREE.AxesHelper | boolean
  gridHelper?: THREE.GridHelper | boolean
  controls?: OrbitControls
  onCreated?: (scene: THREE.Scene, components: SceneComponents) => void
  onBeforeFrame?: CallbackFrame
  onFrame?: CallbackFrame
  onAfterFrame?: CallbackFrame
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const SceneComponent = ({
  renderer: propRenderer,
  rendererType = 'webgpu',
  bgColor,
  bgImage,
  camera: propCamera,
  light: propLight,
  axesHelper: propAxesHelper,
  gridHelper: propGridHelper,
  controls: propControls,
  onCreated,
  onBeforeFrame,
  onAfterFrame,
  children,
  style,
  className
}: SceneProps): JSX.Element => {
  const [containerId] = useState(() => generateUUID())
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSlot, setShowSlot] = useState(false)

  // Use useState instead of useRef to ensure context updates trigger re-render
  const [sceneSlotProps, setSceneSlotProps] = useState<SceneSlotProps>({})

  const beforeFrameChildrenRef = useRef<CallbackFrame[]>([])
  const afterFrameChildrenRef = useRef<CallbackFrame[]>([])
  const frameCallbackSetRef = useRef(false)
  const beforeFrameSetRef = useRef(false)
  const callbackFrameRef = useRef<CallbackFrame>(
    (renderer: R3LRenderer, scene: THREE.Scene, components: SceneComponents) => {
      if (frameCallbackSetRef.current) return

      const camera = components.camera
      if (camera) {
        if (beforeFrameSetRef.current) {
          const bg = scene.background
          scene.background = null
          camera.layers.set(0)
          renderer.render(scene, camera)
          scene.background = bg
        } else {
          renderer.clear()
          camera.layers.set(0)
          renderer.render(scene, camera)
        }
      }
    }
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      console.error('Scene: Container not found')
      return
    }

    let cancelled = false
    let disposeSceneFn: (() => void) | null = null
    let sceneInstance: THREE.Scene | null = null
    let currentRenderer: R3LRenderer | null = null
    let currentControls: OrbitControls | null = null
    let currentLight: THREE.Object3D | null = null
    let currentCamera: THREE.PerspectiveCamera | null = null

    const start = async () => {
      currentRenderer = propRenderer || Renderer(rendererType)
      currentCamera = propCamera || CameraUtil(container)
      currentLight = propLight || LightUtil()
      let currentAxesHelper: THREE.AxesHelper | undefined
      if (propAxesHelper === false) {
        currentAxesHelper = undefined
      } else if (propAxesHelper instanceof THREE.AxesHelper) {
        currentAxesHelper = propAxesHelper
      } else {
        currentAxesHelper = AxesHelperUtil()
      }
      let currentGridHelper: THREE.GridHelper | undefined
      if (propGridHelper === false) {
        currentGridHelper = undefined
      } else if (propGridHelper instanceof THREE.GridHelper) {
        currentGridHelper = propGridHelper
      } else {
        currentGridHelper = new THREE.GridHelper(20, 20, 0xbbbbbb, 0xdddddd)
        currentGridHelper.position.y = 0.01
      }
      currentControls = propControls || Controls(currentCamera, currentRenderer)

      const frame = (renderer: R3LRenderer, scene: THREE.Scene, components: SceneComponents) => {
        callbackFrameRef.current(renderer, scene, components)
      }

      const beforeFrame = (renderer: R3LRenderer, scene: THREE.Scene, components: SceneComponents) => {
        onBeforeFrame?.(renderer, scene, components)
        beforeFrameChildrenRef.current?.forEach((beforeFrameChild) => {
          beforeFrameChild?.(renderer, scene, components)
        })
      }

      const afterFrame = (renderer: R3LRenderer, scene: THREE.Scene, components: SceneComponents) => {
        onAfterFrame?.(renderer, scene, components)
        afterFrameChildrenRef.current?.forEach((afterFrameChild) => {
          afterFrameChild?.(renderer, scene, components)
        })
      }

      const camera = currentCamera
      const light = currentLight
      const controls = currentControls
      if (!camera || !light || !controls) {
        console.error('Scene: Failed to initialize camera, light or controls.')
        return
      }
      const sceneComponents: SceneComponents = {
        camera: camera,
        light: light,
        axesHelper: currentAxesHelper,
        gridHelper: currentGridHelper,
        controls: controls
      }

      const { scene, dispose: disposeScene } = await createScene(
        currentRenderer,
        container,
        sceneComponents,
        frame,
        beforeFrame,
        afterFrame
      )
      sceneInstance = scene
      disposeSceneFn = disposeScene

      if (cancelled) return

      if (bgImage != undefined) {
        const textureLoader = new THREE.TextureLoader()
        textureLoader.load(
          bgImage,
          (texture) => {
            console.log('Background image loaded successfully:', bgImage)
            // Background textures must be in SRGBColorSpace for correct color
            // display in both WebGL and WebGPU.
            texture.colorSpace = THREE.SRGBColorSpace
            scene.background = texture
          },
          undefined,
          (error) => {
            console.error('Failed to load background image:', bgImage, error)
            scene.background = new THREE.Color('#98F5F9') // fallback color
          }
        )
      } else if (bgColor != undefined) {
        scene.background = new THREE.Color(bgColor)
      }

      // Update context value with useState to trigger child component re-render
      setSceneSlotProps({
        container: container,
        renderer: currentRenderer,
        scene: scene,
        sceneComponents: sceneComponents,
        setFrame: (callback: CallbackFrame) => {
          callbackFrameRef.current = callback
          frameCallbackSetRef.current = true // Mark custom frame callback as set
        },
        addBeforeFrame: (callback: CallbackFrame) => {
          beforeFrameChildrenRef.current.push(callback)
          beforeFrameSetRef.current = true
          return () => {
            const index = beforeFrameChildrenRef.current.indexOf(callback)
            if (index > -1) {
              beforeFrameChildrenRef.current.splice(index, 1)
            }
          }
        },
        addAfterFrame: (callback: CallbackFrame) => {
          afterFrameChildrenRef.current.push(callback)
          return () => {
            const index = afterFrameChildrenRef.current.indexOf(callback)
            if (index > -1) {
              afterFrameChildrenRef.current.splice(index, 1)
            }
          }
        }
      })

      onCreated?.(scene, sceneComponents)
      setShowSlot(true)
    }

    start().catch((err) => {
      console.error('Scene: Failed to initialize renderer:', err)
    })

    return () => {
      cancelled = true
      setShowSlot(false)
      setSceneSlotProps({})
      beforeFrameChildrenRef.current = []
      afterFrameChildrenRef.current = []
      frameCallbackSetRef.current = false
      beforeFrameSetRef.current = false

      if (disposeSceneFn) {
        disposeSceneFn()
        disposeSceneFn = null
      }
      // Cleanup background texture
      if (sceneInstance) {
        if (sceneInstance.background && 'dispose' in sceneInstance.background) {
          ;(sceneInstance.background as THREE.Texture).dispose()
        }
        // Cleanup all objects in the scene
        sceneInstance.traverse((child: THREE.Object3D) => {
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
        sceneInstance = null
      }
      currentRenderer?.dispose()
      currentControls?.dispose()
      // LightUtil may not return an object with dispose() — guard it.
      const disposableLight = currentLight as unknown as { dispose?: () => void } | null
      disposableLight?.dispose?.()
      currentCamera?.clear?.()
      currentRenderer = null
      currentControls = null
      currentLight = null
      currentCamera = null
    }
  }, [rendererType])

  return (
    <SceneContext.Provider value={sceneSlotProps}>
      <div
        ref={containerRef}
        id={containerId}
        className={className}
        style={{ position: 'relative', width: '100%', height: '100%', ...style }}
      >
        {showSlot ? children : null}
      </div>
    </SceneContext.Provider>
  )
}

export default SceneComponent
