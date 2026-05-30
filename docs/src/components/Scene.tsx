import { Scene } from 'react-three-lite'
import type * as THREE from 'three'
import type { OrbitControls } from 'three-stdlib'
import type { SceneComponents, CallbackFrame } from 'react-three-lite'

interface SceneComponentProps {
  style?: React.CSSProperties
  modelValue?: THREE.Scene
  renderer?: THREE.WebGLRenderer
  bgColor?: string
  bgImage?: string
  camera?: THREE.PerspectiveCamera
  light?: THREE.Light
  axesHelper?: THREE.AxesHelper
  controls?: OrbitControls
  onCreated?: (scene: THREE.Scene, components: SceneComponents) => void
  onBeforeFrame?: CallbackFrame
  onFrame?: CallbackFrame
  onAfterFrame?: CallbackFrame
  children?: React.ReactNode
}

export default function SceneComponent({
  style,
  modelValue,
  renderer,
  bgColor,
  bgImage,
  camera,
  light,
  axesHelper,
  controls,
  onCreated,
  onBeforeFrame,
  onFrame,
  onAfterFrame,
  children
}: SceneComponentProps) {
  const defaultStyle: React.CSSProperties = {
    marginTop: '10px',
    marginBottom: '16px',
    width: '100%',
    height: '300px'
  }

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera: sceneCamera } = components
    sceneCamera.position.set(0, 1.5, 3)
    onCreated?.(scene, components)
  }

  return (
    <Scene
      style={{ ...defaultStyle, ...style }}
      modelValue={modelValue}
      renderer={renderer}
      bgColor={bgColor}
      bgImage={bgImage}
      camera={camera}
      light={light}
      axesHelper={axesHelper}
      controls={controls}
      onCreated={handleCreated}
      onBeforeFrame={onBeforeFrame}
      onFrame={onFrame}
      onAfterFrame={onAfterFrame}
    >
      {children}
    </Scene>
  )
}