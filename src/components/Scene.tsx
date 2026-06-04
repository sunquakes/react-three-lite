import { useEffect, useRef, useState, createElement } from 'react'
import { Scene, WebGLRenderer, Light, AxesHelper, GridHelper, Color, TextureLoader, PerspectiveCamera } from 'three'
import { OrbitControls } from 'three-stdlib'
import { generateUUID } from '../utils/UUID'
import createScene from '../utils/Scene'
import CameraUtil from '../utils/Camera'
import LightUtil from '../utils/Light'
import Renderer from '../utils/Renderer'
import AxesHelperUtil from '../utils/AxesHelper'
import { SceneContext, SceneComponents, CallbackFrame, SceneSlotProps } from '../context/SceneContext'

interface SceneProps {
  modelValue?: Scene
  renderer?: WebGLRenderer
  bgColor?: string
  bgImage?: string
  camera?: PerspectiveCamera
  light?: Light
  axesHelper?: AxesHelper | boolean
  gridHelper?: GridHelper | boolean
  controls?: OrbitControls
  onCreated?: (scene: Scene, components: SceneComponents) => void
  onBeforeFrame?: CallbackFrame
  onFrame?: CallbackFrame
  onAfterFrame?: CallbackFrame
  children?: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const SceneComponent = ({
  modelValue: _modelValue,
  renderer: propRenderer,
  bgColor,
  bgImage,
  camera: propCamera,
  light: propLight,
  axesHelper: propAxesHelper,
  gridHelper: propGridHelper,
  controls: propControls,
  onCreated,
  onBeforeFrame,
  onFrame: _onFrame,
  onAfterFrame,
  children,
  style,
  className
}: SceneProps): JSX.Element => {
  const UUIDRef = useRef<string>(generateUUID())
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSlot, setShowSlot] = useState(false)
  
  // Use useState instead of useRef to ensure context updates trigger re-render
  const [sceneSlotProps, setSceneSlotProps] = useState<SceneSlotProps>({})

  const beforeFrameChildrenRef = useRef<CallbackFrame[]>([])
  const afterFrameChildrenRef = useRef<CallbackFrame[]>([])
  const frameCallbackSetRef = useRef(false)
  const beforeFrameSetRef = useRef(false)
  const callbackFrameRef = useRef<CallbackFrame>(
    (renderer: WebGLRenderer, scene: Scene, components: SceneComponents) => {
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

    let currentRenderer = propRenderer || Renderer()
    let currentCamera = propCamera || CameraUtil(container)
    let currentLight = propLight || LightUtil()
    let currentAxesHelper: AxesHelper | undefined
    if (propAxesHelper === false) {
      currentAxesHelper = undefined
    } else if (propAxesHelper instanceof AxesHelper) {
      currentAxesHelper = propAxesHelper
    } else {
      currentAxesHelper = AxesHelperUtil()
    }
    let currentGridHelper: GridHelper | undefined
    if (propGridHelper === false) {
      currentGridHelper = undefined
    } else if (propGridHelper instanceof GridHelper) {
      currentGridHelper = propGridHelper
    } else {
      currentGridHelper = new GridHelper(20, 20, 0xbbbbbb, 0xdddddd)
      currentGridHelper.position.y = 0.01
    }
    let currentControls = propControls || new OrbitControls(currentCamera, container)

    const frame = (renderer: WebGLRenderer, scene: Scene, components: SceneComponents) => {
      callbackFrameRef.current(renderer, scene, components)
    }

    const beforeFrame = (renderer: WebGLRenderer, scene: Scene, components: SceneComponents) => {
      onBeforeFrame?.(renderer, scene, components)
      beforeFrameChildrenRef.current?.forEach((beforeFrameChild) => {
        beforeFrameChild?.(renderer, scene, components)
      })
    }

    const afterFrame = (renderer: WebGLRenderer, scene: Scene, components: SceneComponents) => {
      onAfterFrame?.(renderer, scene, components)
      afterFrameChildrenRef.current?.forEach((afterFrameChild) => {
        afterFrameChild?.(renderer, scene, components)
      })
    }

    const sceneComponents: SceneComponents = {
      camera: currentCamera,
      light: currentLight,
      axesHelper: currentAxesHelper,
      gridHelper: currentGridHelper,
      controls: currentControls
    }

    const { scene, dispose: disposeScene } = createScene(currentRenderer, container, sceneComponents, frame, beforeFrame, afterFrame)

    if (bgImage != undefined) {
      const textureLoader = new TextureLoader()
      textureLoader.load(
        bgImage,
        (texture) => {
          console.log('Background image loaded successfully:', bgImage)
          scene.background = texture
        },
        undefined,
        (error) => {
          console.error('Failed to load background image:', bgImage, error)
          scene.background = new Color('#98F5F9') // fallback color
        }
      )
    } else if (bgColor != undefined) {
      scene.background = new Color(bgColor)
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

    return () => {
      disposeScene()
      // 清理背景纹理
      if (scene.background && 'dispose' in scene.background) {
        (scene.background as any).dispose()
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
      currentRenderer.dispose()
      currentControls.dispose()
      currentLight.dispose()
      currentCamera.clear()
    }
  }, [])

  return createElement(SceneContext.Provider, {
    value: sceneSlotProps  // Use useState value
  }, createElement('div', {
    ref: containerRef,
    id: UUIDRef.current,
    className: className,
    style: { position: 'relative', width: '100%', height: '100%', ...style }
  }, showSlot ? children : null))
}

export default SceneComponent
