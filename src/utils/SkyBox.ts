import * as THREE from 'three'

export default class SkyBox {
  public scene: THREE.CubeTexture

  constructor(images: string[]) {
    this.scene = this.load(images)
  }

  private load(images: string[]): THREE.CubeTexture {
    const loader = new THREE.CubeTextureLoader()
    const texture = loader.load(images)
    // CubeTexture used as scene.background must be in SRGBColorSpace,
    // otherwise WebGPU treats it as linear and the skybox appears black.
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }
}
