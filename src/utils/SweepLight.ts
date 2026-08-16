import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  float,
  vec4,
  positionLocal,
  varying,
  abs,
  smoothstep,
  pow,
  clamp,
  max,
  min,
  mod,
  floor,
  If,
} from 'three/tsl'

export interface SweepLightOptions {
  /** Sweep light color, default: 0x00ffff (cyan) */
  color?: number
  /** Sweep speed, default: 0.5 */
  speed?: number
  /** Sweep band width (0-1), default: 0.3 */
  width?: number
  /** Light intensity, default: 1.5 */
  intensity?: number
  /** Sweep direction axis: 0=X, 1=Y, 2=Z, default: 0 (X axis) */
  direction?: number
  /** Animation loop type, default: LoopRepeat */
  loop?: typeof THREE.LoopOnce | typeof THREE.LoopRepeat | typeof THREE.LoopPingPong
}

type SweepTarget = THREE.Mesh | THREE.Group | THREE.Object3D

interface SweepMaterialOptions {
  color: number
  speed: number
  width: number
  intensity: number
  direction: number
  minPos: number
  maxPos: number
  loopType: number
}

function createSweepMaterial(
  options: SweepMaterialOptions
): { material: NodeMaterial; timeUniform: ReturnType<typeof uniform> } {
  const {
    color,
    speed,
    width,
    intensity,
    direction,
    minPos,
    maxPos,
    loopType,
  } = options

  const uTime = uniform(0)
  const uColor = uniform(new THREE.Color(color))
  const uSpeed = uniform(speed)
  const uWidth = uniform(width)
  const uIntensity = uniform(intensity)
  const uDirection = uniform(direction)
  const uMinPos = uniform(minPos)
  const uMaxPos = uniform(maxPos)
  const uLoopType = uniform(loopType)

  // Varying: pass local position from vertex to fragment stage.
  const vLocalPos = varying(positionLocal)

  const material = new NodeMaterial()
  material.transparent = true
  material.depthWrite = false
  material.blending = THREE.AdditiveBlending
  material.side = THREE.DoubleSide

  material.fragmentNode = Fn(() => {
    // Select position component based on direction axis.
    const pos = float(0).toVar()
    If(uDirection.equal(0), () => {
      pos.assign(vLocalPos.x)
    })
      .ElseIf(uDirection.equal(2), () => {
        pos.assign(vLocalPos.z)
      })
      .Else(() => {
        pos.assign(vLocalPos.y)
      })

    const range = uMaxPos.sub(uMinPos)
    const normalizedPos = pos.sub(uMinPos).div(range)

    const cycleTime = float(2.0).div(uSpeed)
    const t = float(0).toVar()

    If(uLoopType.equal(0), () => {
      // LoopOnce: play once and stop at end.
      t.assign(min(uTime.div(cycleTime), float(1.0)))
    })
      .ElseIf(uLoopType.equal(2), () => {
        // LoopPingPong: forward then backward.
        const cycleCount = floor(uTime.div(cycleTime))
        const cycleProgress = mod(uTime, cycleTime).div(cycleTime)
        const isForward = mod(cycleCount, float(2.0)).lessThan(float(1.0))
        t.assign(isForward.select(cycleProgress, float(1.0).sub(cycleProgress)))
      })
      .Else(() => {
        // LoopRepeat: continuous loop.
        t.assign(mod(uTime, cycleTime).div(cycleTime))
      })

    const dist = abs(normalizedPos.sub(t))

    const bandWidth = uWidth
    const band = pow(float(1.0).sub(smoothstep(float(0.0), bandWidth, dist)), float(1.5))

    const trailWidth = bandWidth.mul(3.0)
    const trail = pow(
      max(float(0.0), float(1.0).sub(dist.div(trailWidth))),
      float(2.0)
    ).mul(0.4)

    const alpha = clamp(
      band.add(trail).mul(uIntensity),
      float(0.0),
      float(1.0)
    )

    return vec4(uColor.rgb, alpha)
  })()

  return { material, timeUniform: uTime }
}

class SweepLight {
  private meshes: THREE.Mesh[] = []
  private materials: NodeMaterial[] = []
  private timeUniforms: ReturnType<typeof uniform>[] = []
  private startTime: number
  private pausedTime: number = 0
  private isAnimating: boolean = false
  private isPaused: boolean = false
  private animationId: number | null = null

  constructor(
    target: SweepTarget,
    options: SweepLightOptions = {}
  ) {
    const {
      color = 0x00ffff,
      speed = 0.5,
      width = 0.3,
      intensity = 1.5,
      direction = 0,
      loop = THREE.LoopRepeat,
    } = options

    const loopType = loop === THREE.LoopOnce ? 0 : loop === THREE.LoopPingPong ? 2 : 1

    // Collect meshes from target
    const targetMeshes: THREE.Mesh[] = []
    if ((target as THREE.Mesh).isMesh) {
      targetMeshes.push(target as THREE.Mesh)
    } else {
      target.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          targetMeshes.push(child as THREE.Mesh)
        }
      })
    }

    // Create sweep light for each mesh
    targetMeshes.forEach((mesh) => {
      mesh.updateMatrixWorld(true)
      mesh.geometry.computeBoundingBox()
      const bbox = mesh.geometry.boundingBox!
      const worldMatrix = mesh.matrixWorld

      let minPos: number, maxPos: number
      if (direction === 0) {
        minPos = bbox.min.clone().applyMatrix4(worldMatrix).x
        maxPos = bbox.max.clone().applyMatrix4(worldMatrix).x
      } else if (direction === 2) {
        minPos = bbox.min.clone().applyMatrix4(worldMatrix).z
        maxPos = bbox.max.clone().applyMatrix4(worldMatrix).z
      } else {
        minPos = bbox.min.clone().applyMatrix4(worldMatrix).y
        maxPos = bbox.max.clone().applyMatrix4(worldMatrix).y
      }

      const range = maxPos - minPos
      minPos -= range * 0.2
      maxPos += range * 0.2

      const { material, timeUniform } = createSweepMaterial({
        color,
        speed,
        width,
        intensity,
        direction,
        minPos,
        maxPos,
        loopType,
      })

      const sweepMesh = new THREE.Mesh(mesh.geometry.clone(), material)
      sweepMesh.renderOrder = 999
      sweepMesh.frustumCulled = false

      mesh.add(sweepMesh)

      this.meshes.push(sweepMesh)
      this.materials.push(material)
      this.timeUniforms.push(timeUniform)
    })

    this.startTime = performance.now()
    this.animate()
  }

  /** Internal animation loop using requestAnimationFrame */
  private animate() {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop)
      if (!this.isPaused) {
        const elapsed = (performance.now() - this.startTime) / 1000
        this.timeUniforms.forEach((u) => {
          ;(u as { value: number }).value = elapsed
        })
      }
    }
    if (!this.isAnimating) {
      this.isAnimating = true
      loop()
    }
  }

  /** Play or resume the animation */
  play() {
    if (this.isPaused) {
      // Resume: adjust startTime to account for paused duration
      this.startTime = performance.now() - this.pausedTime * 1000
      this.pausedTime = 0
      this.isPaused = false
    } else if (!this.isAnimating) {
      this.startTime = performance.now()
      this.animate()
    }
  }

  /** Pause the animation at current frame */
  pause() {
    if (this.isAnimating && !this.isPaused) {
      this.pausedTime = (performance.now() - this.startTime) / 1000
      this.isPaused = true
    }
  }

  /** Stop the animation and reset to initial state */
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.isAnimating = false
    this.isPaused = false
    this.pausedTime = 0
    this.startTime = performance.now()
    this.timeUniforms.forEach((u) => {
      ;(u as { value: number }).value = 0
    })
  }

  /** Dispose sweep light and stop animation */
  dispose() {
    this.stop()

    this.meshes.forEach((mesh) => {
      mesh.parent?.remove(mesh)
      mesh.geometry.dispose()
    })
    this.materials.forEach((material) => {
      material.dispose()
    })
    this.meshes = []
    this.materials = []
    this.timeUniforms = []
  }
}

export default SweepLight
