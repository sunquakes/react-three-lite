import { CubeTexture, CubeTextureLoader } from 'three'

export default class SkyBox {
  public scene: CubeTexture

  constructor(images: string[]) {
    this.scene = this.load(images)
  }

  private load(images: string[]): CubeTexture {
    const loader = new CubeTextureLoader()
    return loader.load(images)
  }
}
