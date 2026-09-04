import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Picker from '../utils/Picker'
import { installFakeRaf, type FakeRaf } from './helpers/fakeRaf'

interface PickerInternals {
  raycaster: THREE.Raycaster
  recursive: boolean
  enableHover: boolean
  clickThreshold: number
  enabled: boolean
  hovered: THREE.Object3D | null
  hoverFrameId: number | null
  listeners: Record<'click' | 'hover', Set<unknown>>
}

function internals(picker: Picker): PickerInternals {
  return picker as unknown as PickerInternals
}

// jsdom lays every element out at 0x0, so the NDC conversion would divide by the
// fallback of 1 and place every pointer far outside the frustum. A fixed
// 100x100 box makes the maths predictable: (50, 50) is the centre of the canvas.
const RECT_SIZE = 100

function stubRect(element: HTMLElement) {
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: RECT_SIZE,
      bottom: RECT_SIZE,
      width: RECT_SIZE,
      height: RECT_SIZE,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }) as DOMRect
}

// jsdom does not implement PointerEvent, but the listeners only read clientX /
// clientY, which MouseEvent provides.
function pointerEvent(type: string, clientX: number, clientY: number) {
  return new MouseEvent(type, { clientX, clientY, bubbles: true })
}

describe('Picker', () => {
  let raf: FakeRaf
  let scene: THREE.Scene
  let camera: THREE.PerspectiveCamera
  let domElement: HTMLDivElement
  let mesh: THREE.Mesh

  beforeEach(() => {
    raf = installFakeRaf()

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld(true)
    camera.updateProjectionMatrix()

    mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial())
    mesh.updateMatrixWorld(true)
    scene.add(mesh)

    domElement = document.createElement('div')
    stubRect(domElement)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('attaches the four pointer listeners to the canvas', () => {
      const addEventListener = vi.spyOn(domElement, 'addEventListener')

      const picker = new Picker(scene, camera, domElement)

      expect(addEventListener.mock.calls.map((call) => call[0])).toEqual([
        'pointerdown',
        'pointerup',
        'pointermove',
        'pointerleave'
      ])

      picker.dispose()
    })

    it('picks recursively with hover enabled and a 5px click threshold by default', () => {
      const picker = new Picker(scene, camera, domElement)

      const state = internals(picker)
      expect(state.recursive).toBe(true)
      expect(state.enableHover).toBe(true)
      expect(state.clickThreshold).toBe(5)
      expect(state.enabled).toBe(true)

      picker.dispose()
    })

    it('forwards the near and far planes to the raycaster', () => {
      const picker = new Picker(scene, camera, domElement, { near: 1, far: 20 })

      expect(internals(picker).raycaster.near).toBe(1)
      expect(internals(picker).raycaster.far).toBe(20)

      picker.dispose()
    })
  })

  describe('pickAt', () => {
    it('returns the closest hit with its world space point', () => {
      const picker = new Picker(scene, camera, domElement)

      const event = picker.pickAt(50, 50)

      expect(event).not.toBeNull()
      expect(event?.object).toBe(mesh)
      // The camera looks down -z, so the front face of the box is hit first.
      expect(event?.point.z).toBeCloseTo(1)
      expect(event?.distance).toBeCloseTo(4)
      // The centre of the canvas shoots straight down the shared diagonal of the
      // two front face triangles, so the exact count is a geometry detail. What
      // matters is that `intersection` is the closest of the list.
      expect(event?.intersections[0]).toBe(event?.intersection)
      expect(event?.nativeEvent).toBeUndefined()

      picker.dispose()
    })

    it('reports the pointer in normalized device coordinates', () => {
      const picker = new Picker(scene, camera, domElement)

      expect(picker.pickAt(50, 50)?.pointer.toArray()).toEqual([0, 0])

      picker.dispose()
    })

    it('returns null when the ray misses everything', () => {
      const picker = new Picker(scene, camera, domElement)

      // The top right corner of the frustum passes well outside the box.
      expect(picker.pickAt(RECT_SIZE, 0)).toBeNull()

      picker.dispose()
    })

    it('returns null for an empty scene', () => {
      scene.remove(mesh)
      const picker = new Picker(scene, camera, domElement)

      expect(picker.pickAt(50, 50)).toBeNull()

      picker.dispose()
    })
  })

  describe('filter', () => {
    it('drops the intersections whose object fails the predicate', () => {
      const picker = new Picker(scene, camera, domElement, {
        filter: (object) => object.name === 'pickable'
      })

      expect(picker.pickAt(50, 50)).toBeNull()

      mesh.name = 'pickable'
      expect(picker.pickAt(50, 50)?.object).toBe(mesh)

      picker.dispose()
    })

    it('accepts every object again once the filter is removed', () => {
      const picker = new Picker(scene, camera, domElement, { filter: () => false })

      expect(picker.pickAt(50, 50)).toBeNull()

      picker.setFilter()
      expect(picker.pickAt(50, 50)?.object).toBe(mesh)

      picker.dispose()
    })
  })

  describe('targets', () => {
    it('only tests the objects it was given', () => {
      const other = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial())
      other.updateMatrixWorld(true)

      const picker = new Picker(scene, camera, domElement, { targets: [other] })

      expect(picker.pickAt(50, 50)?.object).toBe(other)

      picker.setTargets([mesh])
      expect(picker.pickAt(50, 50)?.object).toBe(mesh)

      // Passing undefined falls back to the whole scene.
      picker.setTargets()
      expect(picker.pickAt(50, 50)?.object).toBe(mesh)

      picker.dispose()
    })
  })

  describe('layers', () => {
    it('ignores the objects that are not on an enabled layer', () => {
      const picker = new Picker(scene, camera, domElement, { layers: 1 })

      expect(picker.pickAt(50, 50)).toBeNull()

      mesh.layers.set(1)
      expect(picker.pickAt(50, 50)?.object).toBe(mesh)

      picker.dispose()
    })
  })

  describe('click', () => {
    it('emits on a pointer down and up that stayed within the threshold', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      picker.on('click', onClick)

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 52, 51))

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick.mock.calls[0][0].object).toBe(mesh)

      picker.dispose()
    })

    it('emits null when the click landed on nothing', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      picker.on('click', onClick)

      domElement.dispatchEvent(pointerEvent('pointerdown', RECT_SIZE, 0))
      domElement.dispatchEvent(pointerEvent('pointerup', RECT_SIZE, 0))

      expect(onClick).toHaveBeenCalledWith(null)

      picker.dispose()
    })

    it('treats a drag as a camera move rather than a click', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      picker.on('click', onClick)

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 70, 50))

      expect(onClick).not.toHaveBeenCalled()

      picker.dispose()
    })

    it('honours a custom threshold', () => {
      const picker = new Picker(scene, camera, domElement, { clickThreshold: 40 })
      const onClick = vi.fn()
      picker.on('click', onClick)

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 70, 50))

      expect(onClick).toHaveBeenCalledTimes(1)

      picker.dispose()
    })

    it('ignores a pointer up that was not preceded by a pointer down', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      picker.on('click', onClick)

      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(onClick).not.toHaveBeenCalled()

      picker.dispose()
    })

    it('does not raycast while nobody is listening', () => {
      const picker = new Picker(scene, camera, domElement)
      const intersectObjects = vi.spyOn(internals(picker).raycaster, 'intersectObjects')

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(intersectObjects).not.toHaveBeenCalled()

      picker.dispose()
    })
  })

  describe('hover', () => {
    it('coalesces a burst of moves into a single raycast per frame', () => {
      const picker = new Picker(scene, camera, domElement)
      picker.on('hover', vi.fn())
      const intersectObjects = vi.spyOn(internals(picker).raycaster, 'intersectObjects')

      domElement.dispatchEvent(pointerEvent('pointermove', 40, 40))
      domElement.dispatchEvent(pointerEvent('pointermove', 45, 45))
      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))

      expect(raf.request).toHaveBeenCalledTimes(1)
      expect(intersectObjects).not.toHaveBeenCalled()

      raf.flush()

      expect(intersectObjects).toHaveBeenCalledTimes(1)

      picker.dispose()
    })

    it('emits only when the object under the pointer changes', () => {
      const picker = new Picker(scene, camera, domElement)
      const onHover = vi.fn()
      picker.on('hover', onHover)

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      raf.flush()

      expect(onHover).toHaveBeenCalledTimes(1)
      expect(onHover.mock.calls[0][0].object).toBe(mesh)
      expect(picker.getHovered()).toBe(mesh)

      // Still over the same mesh, so there is nothing new to report.
      domElement.dispatchEvent(pointerEvent('pointermove', 52, 52))
      raf.flush()

      expect(onHover).toHaveBeenCalledTimes(1)

      // Moving off the mesh reports the empty space once.
      domElement.dispatchEvent(pointerEvent('pointermove', RECT_SIZE, 0))
      raf.flush()

      expect(onHover).toHaveBeenCalledTimes(2)
      expect(onHover.mock.calls[1][0]).toBeNull()
      expect(picker.getHovered()).toBeNull()

      picker.dispose()
    })

    it('does not schedule a frame while nobody is listening', () => {
      const picker = new Picker(scene, camera, domElement)

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))

      expect(raf.request).not.toHaveBeenCalled()

      picker.dispose()
    })

    it('stays silent when hover is disabled', () => {
      const picker = new Picker(scene, camera, domElement, { enableHover: false })
      const onHover = vi.fn()
      picker.on('hover', onHover)

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      raf.flush()

      expect(onHover).not.toHaveBeenCalled()

      picker.dispose()
    })

    it('reports null when the pointer leaves the canvas', () => {
      const picker = new Picker(scene, camera, domElement)
      const onHover = vi.fn()
      picker.on('hover', onHover)

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      raf.flush()
      onHover.mockClear()

      domElement.dispatchEvent(pointerEvent('pointerleave', 50, 50))

      expect(onHover).toHaveBeenCalledWith(null)
      expect(picker.getHovered()).toBeNull()

      picker.dispose()
    })

    it('does not report a leave when nothing was hovered', () => {
      const picker = new Picker(scene, camera, domElement)
      const onHover = vi.fn()
      picker.on('hover', onHover)

      domElement.dispatchEvent(pointerEvent('pointerleave', 50, 50))

      expect(onHover).not.toHaveBeenCalled()

      picker.dispose()
    })
  })

  describe('setEnabled', () => {
    it('stops reacting to pointer events and clears the hover state', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      const onHover = vi.fn()
      picker.on('click', onClick)
      picker.on('hover', onHover)

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      raf.flush()
      onHover.mockClear()

      picker.setEnabled(false)

      expect(onHover).toHaveBeenCalledWith(null)
      expect(picker.getHovered()).toBeNull()

      onHover.mockClear()
      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      raf.flush()
      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(onHover).not.toHaveBeenCalled()
      expect(onClick).not.toHaveBeenCalled()

      picker.setEnabled(true)
      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(onClick).toHaveBeenCalledTimes(1)

      picker.dispose()
    })
  })

  describe('on / off', () => {
    it('returns an unsubscribe function', () => {
      const picker = new Picker(scene, camera, domElement)
      const onClick = vi.fn()
      const unsubscribe = picker.on('click', onClick)

      unsubscribe()
      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(onClick).not.toHaveBeenCalled()

      picker.dispose()
    })

    it('notifies every listener of the same event', () => {
      const picker = new Picker(scene, camera, domElement)
      const first = vi.fn()
      const second = vi.fn()
      picker.on('click', first)
      picker.on('click', second)

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(first).toHaveBeenCalledTimes(1)
      expect(second).toHaveBeenCalledTimes(1)

      picker.off('click', first)
      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(first).toHaveBeenCalledTimes(1)
      expect(second).toHaveBeenCalledTimes(2)

      picker.dispose()
    })
  })

  describe('dispose', () => {
    it('detaches the listeners and clears the subscriptions', () => {
      const picker = new Picker(scene, camera, domElement)
      const removeEventListener = vi.spyOn(domElement, 'removeEventListener')
      const onClick = vi.fn()
      picker.on('click', onClick)

      picker.dispose()

      expect(removeEventListener.mock.calls.map((call) => call[0])).toEqual([
        'pointerdown',
        'pointerup',
        'pointermove',
        'pointerleave'
      ])
      expect(internals(picker).listeners.click.size).toBe(0)
      expect(internals(picker).listeners.hover.size).toBe(0)

      domElement.dispatchEvent(pointerEvent('pointerdown', 50, 50))
      domElement.dispatchEvent(pointerEvent('pointerup', 50, 50))

      expect(onClick).not.toHaveBeenCalled()
    })

    it('cancels a hover frame that has not run yet', () => {
      const picker = new Picker(scene, camera, domElement)
      picker.on('hover', vi.fn())

      domElement.dispatchEvent(pointerEvent('pointermove', 50, 50))
      expect(internals(picker).hoverFrameId).not.toBeNull()

      picker.dispose()

      expect(raf.cancel).toHaveBeenCalledTimes(1)
      expect(raf.pending.size).toBe(0)
      expect(internals(picker).hoverFrameId).toBeNull()
    })

    it('is safe to call without any pointer activity', () => {
      const picker = new Picker(scene, camera, domElement)

      expect(() => picker.dispose()).not.toThrow()
      expect(raf.cancel).not.toHaveBeenCalled()
    })
  })
})
