import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { SnowCover } from '../utils/SnowCover'

function createGround() {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  )
}

function findShell(object: THREE.Object3D) {
  return object.children.find((child) => child.userData.isSnowCover) as THREE.Mesh | undefined
}

describe('SnowCover', () => {
  it('covers eligible meshes with a shell that shares their geometry', () => {
    const scene = new THREE.Scene()
    const ground = createGround()
    scene.add(ground)

    const cover = new SnowCover({ scene, thickness: 0.2 })
    const shell = findShell(ground)

    expect(shell).toBeDefined()
    expect(shell?.geometry).toBe(ground.geometry)
    expect(shell?.material).toBe(cover.material)
    expect(shell?.parent).toBe(ground)

    // Shells must not swallow pointer picking.
    const intersections: THREE.Intersection[] = []
    shell?.raycast(new THREE.Raycaster(), intersections)
    expect(intersections).toHaveLength(0)

    cover.dispose()
  })

  it('skips surfaces that cannot hold snow', () => {
    const scene = new THREE.Scene()

    const skyBox = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide })
    )
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshBasicMaterial({ transparent: true })
    )
    const lines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial())
    const bare = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial())
    const instanced = new THREE.InstancedMesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial(),
      2
    )

    scene.add(skyBox, glass, lines, bare, instanced)

    const cover = new SnowCover({ scene })

    expect(findShell(skyBox)).toBeUndefined()
    expect(findShell(glass)).toBeUndefined()
    expect(findShell(bare)).toBeUndefined()
    expect(findShell(instanced)).toBeUndefined()

    cover.dispose()
  })

  it('grows to full thickness and then stays there', () => {
    const scene = new THREE.Scene()
    scene.add(createGround())

    const cover = new SnowCover({ scene, duration: 2 })

    expect(cover.value).toBe(0)
    cover.update(1)
    expect(cover.value).toBeCloseTo(0.5)
    cover.update(1)
    expect(cover.value).toBeCloseTo(1)
    cover.update(10)
    expect(cover.value).toBe(1)

    cover.dispose()
  })

  it('picks up meshes that are added after it was created', () => {
    const scene = new THREE.Scene()
    const cover = new SnowCover({ scene })

    const ground = createGround()
    scene.add(ground)

    cover.update(0.2)
    expect(findShell(ground)).toBeUndefined()

    // Auto detection rescans twice per second.
    cover.update(0.3)
    expect(findShell(ground)).toBeDefined()

    cover.dispose()
  })

  it('does not attach twice while rescanning', () => {
    const scene = new THREE.Scene()
    const ground = createGround()
    scene.add(ground)

    const cover = new SnowCover({ scene })
    cover.update(0.5)
    cover.update(0.5)
    cover.update(0.5)

    expect(ground.children.filter((child) => child.userData.isSnowCover)).toHaveLength(1)

    cover.dispose()
  })

  it('restricts accumulation to the provided targets', () => {
    const scene = new THREE.Scene()
    const target = createGround()
    const other = createGround()
    const group = new THREE.Group()
    group.add(target)
    scene.add(group, other)

    const cover = new SnowCover({ scene, targets: group })

    expect(findShell(target)).toBeDefined()
    expect(findShell(other)).toBeUndefined()

    cover.dispose()
  })

  it('removes every shell and releases its material on dispose', () => {
    const scene = new THREE.Scene()
    const ground = createGround()
    scene.add(ground)

    const cover = new SnowCover({ scene })
    const disposeSpy = vi.spyOn(cover.material, 'dispose')

    cover.dispose()

    expect(findShell(ground)).toBeUndefined()
    expect(disposeSpy).toHaveBeenCalledTimes(1)

    // Further updates are ignored once disposed.
    cover.update(1)
    expect(cover.value).toBe(0)
  })
})
