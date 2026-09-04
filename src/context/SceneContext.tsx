import { createContext, useContext } from 'react'
import * as THREE from 'three'
import type { Renderer } from 'three/webgpu'
import type { OrbitControls } from 'three-stdlib'

/**
 * Unified renderer type accepted by R3L utilities and components. Covers both
 * the default WebGPU renderer (three/webgpu) and any user-supplied fallback
 * (WebGLRenderer, which is structurally compatible with the used surface).
 *
 * The Renderer common base class lives in three/webgpu. WebGLRenderer is
 * declared structurally compatible with the used subset (domElement, setSize,
 * setPixelRatio, render, clear, clearDepth, autoClear, dispose).
 */
export type R3LRenderer = Renderer & {
  readonly isWebGLRenderer?: boolean
  readonly isWebGPURenderer?: boolean
}

export type SceneComponents = {
  camera: THREE.Camera
  light: THREE.Object3D
  axesHelper: THREE.AxesHelper | undefined
  gridHelper: THREE.GridHelper | undefined
  controls: OrbitControls
}

export type SceneSlotProps = {
  container?: HTMLElement | undefined
  renderer?: R3LRenderer
  scene?: THREE.Scene
  sceneComponents?: SceneComponents
  picker?: import('../utils/Picker').default
  setFrame?: (callback: CallbackFrame) => void
  addBeforeFrame?: (callback: CallbackFrame) => () => void
  addAfterFrame?: (callback: CallbackFrame) => () => void
}

export type CallbackFrame = (
  renderer: R3LRenderer,
  scene: THREE.Scene,
  components: SceneComponents
) => void

export const SceneContext = createContext<SceneSlotProps>({})

export const useScene = () => useContext(SceneContext)
