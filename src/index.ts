import Scene from './components/Scene'
import GLTFLoader from './components/GLTFLoader'
import FBXLoader from './components/FBXLoader'
import OBJLoader from './components/OBJLoader'
import Bloom from './components/Bloom'
import Rain from './components/Rain'
import Snow from './components/Snow'
import SkyBox from './utils/SkyBox'
import Popup from './utils/Popup'
import Movable from './utils/Movable'
import WaveCircleMesh from './meshes/WaveCircleMesh'
import FlowLineMesh from './meshes/FlowLineMesh'
import Animation from './utils/Animation'
import { SceneContext, useScene } from './context/SceneContext'
import { GLTFLoader as GLTFLoaderFn, FBXLoader as FBXLoaderFn, OBJLoader as OBJLoaderFn } from './utils/ModelLoader'

import SweepLight from './utils/SweepLight'

import { LightGradient, LightGradientOptions } from './utils/Light'

// components
export { Scene, GLTFLoader, FBXLoader, OBJLoader, Bloom, Rain, Snow, SceneContext, useScene }

// types
export type { SceneComponents, CallbackFrame } from './context/SceneContext'
export type { LightGradientOptions }

// class
export { SkyBox, Popup, Movable, WaveCircleMesh, FlowLineMesh, Animation, SweepLight, LightGradient }

// function - async loaders (no hooks)
export { GLTFLoaderFn as GLTFLoaderAsync, FBXLoaderFn as FBXLoaderAsync, OBJLoaderFn as OBJLoaderAsync }

// enum
export { AxisType } from './enums/AxisType'

// namespace export for avoiding naming conflicts
export * as R3L from './index'
