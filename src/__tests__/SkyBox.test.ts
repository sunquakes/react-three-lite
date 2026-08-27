import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import SkyBox from '../utils/SkyBox'

const IMAGES = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']

describe('SkyBox', () => {
  it('loads a cube texture from the six face images', () => {
    const skyBox = new SkyBox(IMAGES)

    expect(skyBox.scene).toBeInstanceOf(THREE.CubeTexture)

    skyBox.dispose()
  })

  it('tags the cube texture as sRGB so WebGPU does not render it black', () => {
    const skyBox = new SkyBox(IMAGES)

    expect(skyBox.scene.colorSpace).toBe(THREE.SRGBColorSpace)

    skyBox.dispose()
  })

  it('disposes the cube texture', () => {
    const skyBox = new SkyBox(IMAGES)
    const spy = vi.spyOn(skyBox.scene, 'dispose')

    skyBox.dispose()

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('is idempotent, so a double dispose cannot double free the texture', () => {
    const skyBox = new SkyBox(IMAGES)
    const spy = vi.spyOn(skyBox.scene, 'dispose')

    skyBox.dispose()
    skyBox.dispose()
    skyBox.dispose()

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
