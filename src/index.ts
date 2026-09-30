import Scene from './components/Scene'
import GLTFLoader from './components/GLTFLoader'
import FBXLoader from './components/FBXLoader'
import OBJLoader from './components/OBJLoader'
import Bloom from './components/Bloom'
import Rain from './components/Rain'
import Snow from './components/Snow'
import GeoObject from './components/GeoObject'
import GeoJsonLayer from './components/GeoJsonLayer'
import TileLayer from './components/TileLayer'
import SkyBox from './utils/SkyBox'
import Popup from './utils/Popup'
import Callout from './utils/Callout'
import Movable from './utils/Movable'
import WaveCircleMesh from './meshes/WaveCircleMesh'
import FlowLineMesh from './meshes/FlowLineMesh'
import Animation from './utils/Animation'
import { SceneContext, useScene } from './context/SceneContext'
import {
  GLTFLoader as GLTFLoaderFn,
  FBXLoader as FBXLoaderFn,
  OBJLoader as OBJLoaderFn,
  disposeModel,
  disposeDRACOLoader
} from './utils/ModelLoader'

import SweepLight from './utils/SweepLight'
import ModelRotator from './utils/ModelRotator'
import Picker from './utils/Picker'
import LightPillar from './utils/LightPillar'
import {
  fitCameraToBox,
  fitCameraToObject,
  fitCameraToGeoPoints,
  fitCameraToPoints,
  isGeoPoint
} from './utils/CameraFit'
import { FitCamera } from './utils/FitCamera'

import { LightGradient, LightGradientOptions } from './utils/Light'
import type { CalloutOptions, LineShape, BendAxis, LabelAnchor } from './utils/Callout'
import type { PickEvent, PickEventType, PickCallback, PickerOptions } from './utils/Picker'
import type { LightPillarOptions } from './utils/LightPillar'
import type { CameraFitOptions } from './utils/CameraFit'

// components
export {
  Scene,
  GLTFLoader,
  FBXLoader,
  OBJLoader,
  Bloom,
  Rain,
  Snow,
  GeoObject,
  GeoJsonLayer,
  TileLayer,
  SceneContext,
  useScene
}

// GIS reference system
export {
  GeoReference,
  createGeoReference,
  bindSceneGeo,
  getSceneGeo,
  ensureSceneGeo,
  createLocalPlane,
  mercatorProject,
  mercatorUnproject,
  mercatorCRS,
  convertDatum,
  toWGS84,
  fromWGS84,
  wgs84ToGcj02,
  gcj02ToWgs84,
  gcj02ToBd09,
  bd09ToGcj02,
  flattenGeoJson,
  collectGeometries,
  TILE_SIZE,
  lngLatToTile,
  tileToLngLatBounds,
  tileToCorners,
  selectTiles,
  selectTilesInBounds,
  tileUrl
} from './crs/index'
export type {
  GeoPoint,
  DatumType,
  CrsCode,
  CRS,
  LocalPlane,
  AxesMapping,
  GeoReferenceOptions
} from './crs/types'
export type { ScenePosition, SceneLocalPoint } from './crs/SceneGeo'
export type {
  GeoJsonData,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  GeoJsonGeometryData,
  GeoJsonPoint,
  GeoJsonMultiPoint,
  GeoJsonLineString,
  GeoJsonMultiLineString,
  GeoJsonPolygon,
  GeoJsonMultiPolygon,
  GeoJsonRingSet,
  GeoJsonPosition
} from './crs/GeoJson'
export type { GeoObjectProps } from './components/GeoObject'
export type { GeoJsonLayerProps, GeoJsonStyle } from './components/GeoJsonLayer'
export type { TileLayerProps } from './components/TileLayer'
export type { TileIndex, TileBounds, TileCorners } from './crs/Tiles'
export type { GridHelperOptions } from './components/Scene'

// types
export type { SceneComponents, CallbackFrame, R3LRenderer } from './context/SceneContext'
export type { RendererType } from './utils/Renderer'
export type { LightGradientOptions, CalloutOptions, LineShape, BendAxis, LabelAnchor }
export type { PickEvent, PickEventType, PickCallback, PickerOptions }
export type { LightPillarOptions }
export type { CameraFitOptions }
export type { FitCameraOptions } from './utils/FitCamera'

// class
export {
  SkyBox,
  Popup,
  Callout,
  Movable,
  WaveCircleMesh,
  FlowLineMesh,
  Animation,
  SweepLight,
  LightGradient,
  ModelRotator,
  Picker,
  LightPillar,
  FitCamera
}

// function - async loaders (no hooks)
export {
  GLTFLoaderFn as GLTFLoaderAsync,
  FBXLoaderFn as FBXLoaderAsync,
  OBJLoaderFn as OBJLoaderAsync
}

// function - resource cleanup for models loaded through the async loaders
export { disposeModel, disposeDRACOLoader }

// function - reference-system agnostic camera framing
export { fitCameraToBox, fitCameraToObject, fitCameraToGeoPoints, fitCameraToPoints, isGeoPoint }
export type { FitPoint, LocalPoint, FitPointsOptions } from './utils/CameraFit'

// enum
export { AxisType } from './enums/AxisType'

// namespace export for avoiding naming conflicts
export * as R3L from './index'
