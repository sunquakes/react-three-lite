import { describe, expect, it } from 'vitest'
import * as api from '../index'

// The exports below are the published contract of the package. Adding a name is
// a minor release, removing or renaming one is a breaking change - this test
// exists so neither can happen by accident, especially before 1.0.0 freezes the
// API. Update the list deliberately, together with the changelog.
const EXPECTED_EXPORTS = [
  'AxisType',
  'Animation',
  'Bloom',
  'Callout',
  'FBXLoader',
  'FBXLoaderAsync',
  'FlowLineMesh',
  'GLTFLoader',
  'GLTFLoaderAsync',
  'GeoJsonLayer',
  'GeoObject',
  'GeoReference',
  'LightGradient',
  'LightPillar',
  'ModelRotator',
  'Movable',
  'OBJLoader',
  'OBJLoaderAsync',
  'Picker',
  'Popup',
  'R3L',
  'Rain',
  'Scene',
  'SceneContext',
  'SkyBox',
  'Snow',
  'SweepLight',
  'TILE_SIZE',
  'TileLayer',
  'WaveCircleMesh',
  'bd09ToGcj02',
  'bindSceneGeo',
  'collectGeometries',
  'convertDatum',
  'createGeoReference',
  'createLocalPlane',
  'disposeDRACOLoader',
  'disposeModel',
  'ensureSceneGeo',
  'FitCamera',
  'fitCameraToBox',
  'fitCameraToGeoPoints',
  'fitCameraToObject',
  'fitCameraToPoints',
  'isGeoPoint',
  'flattenGeoJson',
  'fromWGS84',
  'gcj02ToBd09',
  'gcj02ToWgs84',
  'getSceneGeo',
  'lngLatToTile',
  'mercatorCRS',
  'mercatorProject',
  'mercatorUnproject',
  'selectTiles',
  'selectTilesInBounds',
  'tileToCorners',
  'tileToLngLatBounds',
  'tileUrl',
  'toWGS84',
  'useScene',
  'wgs84ToGcj02'
] as const

describe('public API surface', () => {
  it('exports exactly the documented names', () => {
    expect(Object.keys(api).sort()).toEqual([...EXPECTED_EXPORTS].sort())
  })

  it('exports every name as a usable value', () => {
    const record = api as unknown as Record<string, unknown>

    EXPECTED_EXPORTS.forEach((name) => {
      expect(record[name], `${name} must not be undefined`).toBeDefined()
    })
  })

  it('exposes components and classes as constructible functions', () => {
    const callables = [
      'Animation',
      'Bloom',
      'Callout',
      'FBXLoader',
      'FlowLineMesh',
      'GLTFLoader',
      'GeoObject',
      'GeoJsonLayer',
      'GeoReference',
      'LightGradient',
      'LightPillar',
      'ModelRotator',
      'Movable',
      'OBJLoader',
      'Popup',
      'Picker',
      'Rain',
      'Scene',
      'SkyBox',
      'Snow',
      'SweepLight',
      'TileLayer',
      'WaveCircleMesh',
      'useScene',
      'disposeModel',
      'disposeDRACOLoader',
      'FitCamera',
      'fitCameraToBox',
      'fitCameraToObject',
      'fitCameraToGeoPoints',
      'fitCameraToPoints',
      'isGeoPoint',
      'createGeoReference',
      'bindSceneGeo',
      'getSceneGeo',
      'ensureSceneGeo',
      'createLocalPlane',
      'mercatorProject',
      'mercatorUnproject',
      'convertDatum',
      'toWGS84',
      'fromWGS84',
      'wgs84ToGcj02',
      'gcj02ToWgs84',
      'gcj02ToBd09',
      'bd09ToGcj02',
      'flattenGeoJson',
      'collectGeometries',
      'FBXLoaderAsync',
      'GLTFLoaderAsync',
      'OBJLoaderAsync',
      'lngLatToTile',
      'tileToLngLatBounds',
      'tileToCorners',
      'selectTiles',
      'selectTilesInBounds',
      'tileUrl'
    ]
    const record = api as unknown as Record<string, unknown>

    callables.forEach((name) => {
      expect(typeof record[name], `${name} should be a function`).toBe('function')
    })
  })

  it('keeps the AxisType enum values stable, they are part of serialized options', () => {
    expect(api.AxisType.X).toBe('x')
    expect(api.AxisType.Y).toBe('y')
    expect(api.AxisType.Z).toBe('z')
  })

  it('re-exports itself under the R3L namespace for script tag style access', () => {
    expect(api.R3L.Scene).toBe(api.Scene)
    expect(api.R3L.WaveCircleMesh).toBe(api.WaveCircleMesh)
  })
})
