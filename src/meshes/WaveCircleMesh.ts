import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  fract,
  distance,
  step,
  oneMinus,
  max,
  mix,
  float,
  vec4,
  positionLocal,
  frontFacing,
  Discard,
  If,
  clamp
} from 'three/tsl'
import { AxisType } from '../enums/AxisType'

interface Array4 extends Array<number> {
  0: number
  1: number
  2: number
  3: number
  length: 4
}

interface WaveCircleMeshOptions {
  verticalAxis?: AxisType
  radius?: number
  color?: Array4
  speed?: number
  isWebGPU?: boolean
}

function getGeometry(axis: AxisType, radius: number): THREE.CircleGeometry {
  const geometry = new THREE.CircleGeometry(radius)
  const rotateMatrix = new THREE.Matrix4()

  if (axis === AxisType.X) {
    rotateMatrix.makeRotationY(Math.PI / 2)
  } else if (axis === AxisType.Y) {
    rotateMatrix.makeRotationX(-Math.PI / 2)
  }

  geometry.applyMatrix4(rotateMatrix)
  return geometry
}

function getMaterial(
  radius?: number,
  color?: Array4,
  isWebGPU: boolean = false
): { material: NodeMaterial; timeUniform: ReturnType<typeof uniform> } {
  const uTime = uniform(0)
  const uRadius = uniform(radius ?? 1)
  const uCenter = uniform(new THREE.Vector3(0, 0, 0))

  // 取自截图WebGL正确颜色 [R,G,B,A]
  const origColor = color ?? [0.52, 0.78, 0.80, 1]

  let r = origColor[0]
  let g = origColor[1]
  let b = origColor[2]
  const a = origColor[3]

  // WebGPU预校正，抵消sRGB亮度偏差
  if (isWebGPU) {
    const brightness = 0.86
    r = Math.pow(r, 2.2) * brightness
    g = Math.pow(g, 2.2) * brightness
    b = Math.pow(b, 2.2) * brightness
  }

  const uColor = uniform(new THREE.Vector4(r, g, b, a))

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false
  material.blending = THREE.NormalBlending

  material.fragmentNode = Fn(() => {
    If(frontFacing.not(), () => {
      Discard()
    })

    const pos = positionLocal
    const dis = distance(pos, uCenter)
    const per = fract(uTime)

    const adjustedPer = per.add(oneMinus(step(float(0.5), per)).mul(0.5))
    const m = adjustedPer.mul(uRadius)

    let alpha = oneMinus(dis.div(m))
    alpha = clamp(alpha, float(0), float(1))

    const inBand1 = step(m.mul(0.5), dis).mul(oneMinus(step(m.mul(0.52), dis)))
    const inBand2 = step(m.mul(0.7), dis).mul(oneMinus(step(m.mul(0.72), dis)))
    const inBands = max(inBand1, inBand2)

    const finalAlpha = mix(alpha, float(0.8), inBands)

    If(finalAlpha.lessThanEqual(float(0)), () => {
      Discard()
    })

    // Shader直接输出颜色，无额外亮度处理
    return vec4(uColor.rgb, finalAlpha)
  })()

  return { material, timeUniform: uTime }
}

export default class WaveCircleMesh extends THREE.Mesh {
  private animationId: number | null = null
  private readonly timeUniform: ReturnType<typeof uniform>

  constructor(options: WaveCircleMeshOptions = {}) {
    const geo = getGeometry(options.verticalAxis ?? AxisType.Y, options.radius ?? 1)
    const { material, timeUniform } = getMaterial(
      options.radius,
      options.color,
      options.isWebGPU ?? false
    )

    super(geo, material)

    this.timeUniform = timeUniform
    this.startAnimate(options.speed ?? 1)
  }

  private startAnimate(speed: number) {
    const tick = () => {
      this.animationId = requestAnimationFrame(tick)
      ;(this.timeUniform as { value: number }).value += 0.005 * speed
    }

    tick()
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }

    this.geometry.dispose()
    ;(this.material as NodeMaterial).dispose()
  }
}