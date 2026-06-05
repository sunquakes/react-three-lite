import {
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  Color,
  Object3D,
  Group,
  LoopOnce,
  LoopRepeat,
  LoopPingPong,
} from 'three'

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
  loop?: typeof LoopOnce | typeof LoopRepeat | typeof LoopPingPong
}

const vertexShader = `
  varying vec3 vLocalPosition;

  void main() {
    vLocalPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uSpeed;
  uniform float uWidth;
  uniform float uIntensity;
  uniform int uDirection;
  uniform float uMinPos;
  uniform float uMaxPos;
  uniform int uLoopType;

  varying vec3 vLocalPosition;

  void main() {
    float pos;
    if (uDirection == 0) {
      pos = vLocalPosition.x;
    } else if (uDirection == 2) {
      pos = vLocalPosition.z;
    } else {
      pos = vLocalPosition.y;
    }

    float range = uMaxPos - uMinPos;
    float normalizedPos = (pos - uMinPos) / range;
    
    float cycleTime = 2.0 / uSpeed;
    float t;
    
    if (uLoopType == 0) {
      // LoopOnce: play once and stop
      t = min(uTime / cycleTime, 1.0);
    } else if (uLoopType == 2) {
      // LoopPingPong: forward then backward
      float cycleCount = floor(uTime / cycleTime);
      float cycleProgress = mod(uTime, cycleTime) / cycleTime;
      t = mod(cycleCount, 2.0) < 1.0 ? cycleProgress : 1.0 - cycleProgress;
    } else {
      // LoopRepeat: continuous loop
      t = mod(uTime, cycleTime) / cycleTime;
    }
    
    float dist = abs(normalizedPos - t);
    
    float bandWidth = uWidth;
    float band = 1.0 - smoothstep(0.0, bandWidth, dist);
    band = pow(band, 1.5);
    
    float trailWidth = bandWidth * 3.0;
    float trail = max(0.0, 1.0 - dist / trailWidth);
    trail = pow(trail, 2.0) * 0.4;
    
    float alpha = (band + trail) * uIntensity;
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(uColor, alpha);
  }
`

type SweepTarget = Mesh | Group | Object3D

class SweepLight {
  private meshes: Mesh[] = []
  private materials: ShaderMaterial[] = []
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
      loop = LoopRepeat,
    } = options

    // Collect meshes from target
    const targetMeshes: Mesh[] = []
    if ((target as Mesh).isMesh) {
      targetMeshes.push(target as Mesh)
    } else {
      target.traverse((child) => {
        if ((child as Mesh).isMesh) {
          targetMeshes.push(child as Mesh)
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

      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new Color(color) },
          uSpeed: { value: speed },
          uWidth: { value: width },
          uIntensity: { value: intensity },
          uDirection: { value: direction },
          uMinPos: { value: minPos },
          uMaxPos: { value: maxPos },
          uLoopType: { value: loop === LoopOnce ? 0 : loop === LoopPingPong ? 2 : 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      })

      const sweepMesh = new Mesh(mesh.geometry.clone(), material)
      sweepMesh.renderOrder = 999
      sweepMesh.frustumCulled = false

      mesh.add(sweepMesh)

      this.meshes.push(sweepMesh)
      this.materials.push(material)
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
        this.materials.forEach((material) => {
          material.uniforms.uTime.value = elapsed
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
    this.materials.forEach((material) => {
      material.uniforms.uTime.value = 0
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
  }
}

export default SweepLight
