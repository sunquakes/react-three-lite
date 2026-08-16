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
  If
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
}

function getGeometry(axis: AxisType, radius: number): THREE.CircleGeometry {
  const geometry = new THREE.CircleGeometry(radius)
  let rotateMatrix: THREE.Matrix4
  if (axis === AxisType.X) {
    rotateMatrix = new THREE.Matrix4().makeRotationY((Math.PI / 180) * 90)
  } else if (axis === AxisType.Y) {
    rotateMatrix = new THREE.Matrix4().makeRotationX((-Math.PI / 180) * 90)
  } else {
    rotateMatrix = new THREE.Matrix4()
  }
  geometry.applyMatrix4(rotateMatrix)
  return geometry
}

function getMaterial(
  radius?: number,
  color?: Array4
): { material: NodeMaterial; timeUniform: ReturnType<typeof uniform> } {
  const uTime = uniform(0)
  const uRadius = uniform(radius ?? 1)
  const uCenter = uniform(new THREE.Vector3(0, 0, 0))
  const uColor = uniform(new THREE.Vector4().fromArray(color ?? [0.6, 0.96, 0.98, 1]))

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false

  // Fragment shader — distance-based wave with ring bands.
  material.fragmentNode = Fn(() => {
    // Discard back-facing fragments (original: if (gl_FrontFacing == false) discard)
    If(frontFacing.not(), () => {
      Discard()
    })

    const pos = positionLocal
    const dis = distance(pos, uCenter)
    const per = fract(uTime)

    // if (per < 0.5) per += 0.5  — branchless: per + (1 - step(0.5, per)) * 0.5
    const adjustedPer = per.add(oneMinus(step(float(0.5), per)).mul(0.5))

    const alpha = oneMinus(dis.div(adjustedPer).div(uRadius))

    // Ring bands: if (dis >= 0.5*m && dis <= 0.52*m || dis >= 0.7*m && dis <= 0.72*m) alpha = 0.8
    const m = adjustedPer.mul(uRadius)
    const inBand1 = step(m.mul(0.5), dis).mul(oneMinus(step(m.mul(0.52), dis)))
    const inBand2 = step(m.mul(0.7), dis).mul(oneMinus(step(m.mul(0.72), dis)))
    const inBands = max(inBand1, inBand2)

    const finalAlpha = mix(alpha, float(0.8), inBands)

    return vec4(uColor.rgb, finalAlpha)
  })()

  return { material, timeUniform: uTime }
}

export default class WaveCircleMesh extends THREE.Mesh {
  private animationId: number | null = null
  private timeUniform: ReturnType<typeof uniform>

  constructor(options: WaveCircleMeshOptions = {}) {
    const geometry = getGeometry(options.verticalAxis ?? AxisType.Y, options.radius ?? 1)
    const { material, timeUniform } = getMaterial(options.radius, options.color)
    super(geometry, material)
    this.timeUniform = timeUniform
    this.create(options.speed ?? 1)
  }

  private create(speed: number) {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      ;(this.timeUniform as { value: number }).value += 0.005 * speed
    }
    animate()
  }

  /**
   * Dispose wave circle mesh and release resources.
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.geometry.dispose()
    ;(this.material as NodeMaterial).dispose()
  }
}
