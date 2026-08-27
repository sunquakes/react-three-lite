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
  'LightGradient',
  'ModelRotator',
  'Movable',
  'OBJLoader',
  'OBJLoaderAsync',
  'Popup',
  'R3L',
  'Rain',
  'Scene',
  'SceneContext',
  'SkyBox',
  'Snow',
  'SweepLight',
  'WaveCircleMesh',
  'disposeDRACOLoader',
  'disposeModel',
  'useScene'
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
      'LightGradient',
      'ModelRotator',
      'Movable',
      'OBJLoader',
      'Popup',
      'Rain',
      'Scene',
      'SkyBox',
      'Snow',
      'SweepLight',
      'WaveCircleMesh',
      'useScene',
      'disposeModel',
      'disposeDRACOLoader',
      'FBXLoaderAsync',
      'GLTFLoaderAsync',
      'OBJLoaderAsync'
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
