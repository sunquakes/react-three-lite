import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { disposeModel } from '../utils/ModelLoader'

interface FakeTexture {
  isTexture: true
  dispose: ReturnType<typeof vi.fn>
}

function createFakeTexture(): FakeTexture {
  return { isTexture: true, dispose: vi.fn() }
}

describe('disposeModel', () => {
  it('disposes geometry and material of every descendant', () => {
    const root = new THREE.Group()
    const parentMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    const childMesh = new THREE.Mesh(new THREE.SphereGeometry(), new THREE.MeshBasicMaterial())
    parentMesh.add(childMesh)
    root.add(parentMesh)

    const spies = [
      vi.spyOn(parentMesh.geometry, 'dispose'),
      vi.spyOn(parentMesh.material, 'dispose'),
      vi.spyOn(childMesh.geometry, 'dispose'),
      vi.spyOn(childMesh.material, 'dispose')
    ]

    disposeModel(root)

    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
  })

  it('disposes every material of a multi-material mesh', () => {
    const materials = [new THREE.MeshBasicMaterial(), new THREE.MeshBasicMaterial()]
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), materials)
    const spies = materials.map((material) => vi.spyOn(material, 'dispose'))

    disposeModel(mesh)

    spies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1))
  })

  it('disposes any texture held by a material, not just the well known slots', () => {
    const material = new THREE.MeshStandardMaterial()
    const map = createFakeTexture()
    const normalMap = createFakeTexture()
    const exotic = createFakeTexture()

    // `map` / `normalMap` are standard slots, `exotic` is not - the old
    // allowlist based implementation leaked textures like this one.
    Object.assign(material, { map, normalMap, exoticCustomMap: exotic })

    disposeModel(new THREE.Mesh(new THREE.BoxGeometry(), material))

    expect(map.dispose).toHaveBeenCalledTimes(1)
    expect(normalMap.dispose).toHaveBeenCalledTimes(1)
    expect(exotic.dispose).toHaveBeenCalledTimes(1)
  })

  it('ignores material properties that are not textures', () => {
    const material = new THREE.MeshBasicMaterial()
    Object.assign(material, { map: null, userTag: 'plain-string', count: 0 })

    expect(() => disposeModel(new THREE.Mesh(new THREE.BoxGeometry(), material))).not.toThrow()
  })

  it('detaches the model from its parent', () => {
    const scene = new THREE.Scene()
    const model = new THREE.Group()
    scene.add(model)

    disposeModel(model)

    expect(scene.children).not.toContain(model)
    expect(model.parent).toBeNull()
  })

  it('handles a model without geometry, material or parent', () => {
    expect(() => disposeModel(new THREE.Object3D())).not.toThrow()
  })
})
