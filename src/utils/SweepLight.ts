import {
  ShaderMaterial,
  Mesh,
  AdditiveBlending,
  DoubleSide,
  Color,
  Scene,
} from 'three'

export interface SweepLightOptions {
  /** Sweep light color, default: 0x00ffff (cyan) */
  color?: number
  /** Sweep speed, default: 1.0 */
  speed?: number
  /** Sweep band width (0-1), default: 0.3 */
  width?: number
  /** Light intensity, default: 1.5 */
  intensity?: number
  /** Sweep direction axis: 0=X, 1=Y, 2=Z, default: 0 (X axis) */
  direction?: number
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
    float t = mod(uTime, cycleTime) / cycleTime;
    
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

class SweepLight {
  private mesh: Mesh
  private material: ShaderMaterial
  private startTime: number
  private minPos: number
  private maxPos: number

  constructor(
    scene: Scene,
    target: Mesh,
    options: SweepLightOptions = {}
  ) {
    const {
      color = 0x00ffff,
      speed = 1.0,
      width = 0.3,
      intensity = 1.5,
      direction = 0,
    } = options

    // Calculate model bounds in world space
    target.updateMatrixWorld(true)
    target.geometry.computeBoundingBox()
    const bbox = target.geometry.boundingBox!
    const worldMatrix = target.matrixWorld

    const min = bbox.min.clone().applyMatrix4(worldMatrix)
    const max = bbox.max.clone().applyMatrix4(worldMatrix)

    if (direction === 0) {
      this.minPos = min.x
      this.maxPos = max.x
    } else if (direction === 2) {
      this.minPos = min.z
      this.maxPos = max.z
    } else {
      this.minPos = min.y
      this.maxPos = max.y
    }

    const range = this.maxPos - this.minPos
    this.minPos -= range * 0.2
    this.maxPos += range * 0.2

    // Create sweep light material
    this.material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(color) },
        uSpeed: { value: speed },
        uWidth: { value: width },
        uIntensity: { value: intensity },
        uDirection: { value: direction },
        uMinPos: { value: this.minPos },
        uMaxPos: { value: this.maxPos },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    })

    // Create sweep mesh as child of target to inherit transforms
    this.mesh = new Mesh(target.geometry.clone(), this.material)
    this.mesh.renderOrder = 999
    this.mesh.frustumCulled = false

    target.add(this.mesh)

    this.startTime = performance.now()
  }

  /** Update sweep light animation - call this in your frame callback */
  update(target: Mesh) {
    this.material.uniforms.uTime.value = (performance.now() - this.startTime) / 1000
  }

  /** Dispose sweep light and remove from scene */
  dispose(scene: Scene) {
    this.mesh.parent?.remove(this.mesh)
    this.material.dispose()
    this.mesh.geometry.dispose()
  }
}

export default SweepLight
