import { createContext, useContext } from 'react'
import { Camera, Light, AxesHelper, GridHelper, WebGLRenderer, Scene } from 'three'
import type { OrbitControls } from 'three-stdlib'

export type SceneComponents = {
  camera: Camera
  light: Light
  axesHelper: AxesHelper | undefined
  gridHelper: GridHelper | undefined
  controls: OrbitControls
}

export type SceneSlotProps = {
  container?: HTMLElement | undefined
  renderer?: WebGLRenderer
  scene?: Scene
  sceneComponents?: SceneComponents
  setFrame?: (callback: CallbackFrame) => void
  addBeforeFrame?: (callback: CallbackFrame) => () => void
  addAfterFrame?: (callback: CallbackFrame) => () => void
}

export type CallbackFrame = (
  renderer: WebGLRenderer,
  scene: Scene,
  components: SceneComponents
) => void

export const SceneContext = createContext<SceneSlotProps>({})

export const useScene = () => useContext(SceneContext)
