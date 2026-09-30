// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react-dom/test-utils'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import * as THREE from 'three'
import { SceneContext, type SceneSlotProps } from '../context/SceneContext'
import type { SceneComponents } from '../context/SceneContext'
import TileLayer from '../components/TileLayer'
import { createGeoReference } from '../crs/GeoReference'

const TEMPLATE = 'https://example.test/{z}/{x}/{y}.png'
const ORIGIN = { lng: 120.60682, lat: 31.330898 }

type CapturedRequest = {
  url: string
  onLoad?: (texture: THREE.Texture) => void
  onError?: (event: unknown) => void
}

describe('TileLayer request pipeline (integration)', () => {
  let loadSpy: MockInstance<typeof THREE.TextureLoader.prototype.load>
  let requests: CapturedRequest[]
  let afterFrames: Array<(r: unknown, s: THREE.Scene, c: SceneComponents) => void>
  let container: HTMLDivElement | null
  let root: Root | null
  let camera: THREE.PerspectiveCamera
  let scene: THREE.Scene

  beforeEach(() => {
    requests = []
    afterFrames = []
    loadSpy = vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(
      (url, onLoad, _onProgress, onError) => {
        requests.push({
          url,
          onLoad: onLoad as CapturedRequest['onLoad'],
          onError: onError as CapturedRequest['onError']
        })
        return new THREE.Texture()
      }
    )
  })

  afterEach(() => {
    loadSpy.mockRestore()
    if (root) {
      act(() => {
        root!.unmount()
      })
    }
    container?.remove()
    container = null
    root = null
  })

  const mount = async (): Promise<void> => {
    scene = new THREE.Scene()
    scene.background = new THREE.Color('#1a1a2e')
    camera = new THREE.PerspectiveCamera(75, 2, 0.1, 4000)
    camera.position.set(0, 450, 450)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const controls = {
      target: new THREE.Vector3(0, 0, 0),
      maxPolarAngle: Math.PI,
      maxDistance: Infinity,
      update: () => {},
      getPolarAngle: () => 0,
      getAzimuthalAngle: () => 0
    } as unknown as SceneComponents['controls']
    const geo = createGeoReference(ORIGIN)
    const sceneComponents: SceneComponents = {
      camera,
      light: new THREE.Object3D(),
      axesHelper: undefined,
      gridHelper: undefined,
      controls,
      geo
    }
    const ctx: SceneSlotProps = {
      scene,
      sceneComponents,
      geo,
      renderer: { domElement: { clientHeight: 300 } } as unknown as SceneSlotProps['renderer'],
      addAfterFrame: (cb) => {
        afterFrames.push(cb as typeof afterFrames[number])
        return () => {}
      }
    }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(
        React.createElement(
          SceneContext.Provider,
          { value: ctx },
          React.createElement(TileLayer, { url: TEMPLATE, zoom: 15, datum: 'GCJ02' })
        )
      )
    })
  }

  const runFrame = (): void => {
    act(() => {
      afterFrames.forEach((cb) => cb({}, scene, {} as SceneComponents))
    })
  }

  const settleAllLoads = (): void => {
    act(() => {
      requests.forEach((request) => {
        request.onLoad?.(new THREE.Texture())
      })
    })
  }

  it('issues initial tile requests through the load queue', async () => {
    await mount()

    // The pyramid must enqueue the ideal set and pump at least one download
    // (coarse root covers first). Zero requests here reproduces the reported
    // "no tile image requested" symptom.
    expect(requests.length).toBeGreaterThan(0)
    expect(requests[0].url).toMatch(/\/0\/|\/1\//)
  })

  it('renders visible tile meshes once textures arrive', async () => {
    await mount()
    settleAllLoads()

    const group = scene.children.find((child) => child.name === 'TileLayer')
    expect(group).toBeDefined()
    const visibleTiles = (group as THREE.Group).children.filter(
      (child) => child instanceof THREE.Mesh && child.visible
    )
    // The render set must put at least the root covers on screen.
    expect(visibleTiles.length).toBeGreaterThan(0)
  })

  it('re-selects after zooming and keeps the view covered', async () => {
    await mount()
    settleAllLoads()
    const loadedCount = requests.length
    expect(loadedCount).toBeGreaterThan(0)

    // Dolly out ~20% along the view axis, far beyond the 2% orbit-distance
    // trigger, run a frame, then let the trailing-throttle timer fire so the
    // re-selection traversal completes.
    camera.position.multiplyScalar(1.2)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    runFrame()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250))
    })

    // Coarser levels are already cached from the initial full-chain load, so
    // zooming out may legitimately issue no new request; what must hold is
    // that the view stays covered by visible tile meshes.
    const group = scene.children.find((child) => child.name === 'TileLayer')
    const visibleTiles = (group as THREE.Group).children.filter(
      (child) => child instanceof THREE.Mesh && child.visible
    )
    expect(visibleTiles.length).toBeGreaterThan(0)
  })
})
