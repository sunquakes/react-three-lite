import type { AxisType } from '../enums/AxisType'

declare global {
  type Array3 = [number, number, number]

  type Array4 = [number, number, number, number]

  type Position = Array3

  type LoadEvent = {
    type: string
    progress: number
  }

  type WaveCircleMeshOptions = {
    radius?: number
    color?: Array4
    speed?: number
    verticalAxis?: AxisType
  }

  type FlowLineMeshOptions = {
    points?: THREE.Vector3[]
    color?: Array4
    arrowColor?: Array3
    speed?: number
    width?: number
    axis?: AxisType
    textureRepeat?: number
  }
}

export {}
