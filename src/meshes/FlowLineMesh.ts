import { CanvasTexture, RepeatWrapping, Vector3, BufferGeometry, Float32BufferAttribute, ShaderMaterial, Mesh, AdditiveBlending, DoubleSide, Texture, CatmullRomCurve3 } from 'three'
import { AxisType } from '../enums/AxisType'

function createArrowTexture(arrowColor: [number, number, number]): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256

  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const r = Math.round(arrowColor[0] * 255)
  const g = Math.round(arrowColor[1] * 255)
  const b = Math.round(arrowColor[2] * 255)

  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`

  const arrowWidth = 240
  const arrowHeight = 100
  const lineThickness = 24
  const centerX = 256
  const centerY = 128

  ctx.beginPath()
  ctx.moveTo(centerX - arrowWidth / 2, centerY - arrowHeight / 2)
  ctx.lineTo(centerX + arrowWidth / 2, centerY)
  ctx.lineTo(centerX + arrowWidth / 2 - lineThickness, centerY + lineThickness * 0.5)
  ctx.lineTo(centerX - arrowWidth / 2, centerY - arrowHeight / 2 + lineThickness)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(centerX - arrowWidth / 2, centerY + arrowHeight / 2)
  ctx.lineTo(centerX + arrowWidth / 2, centerY)
  ctx.lineTo(centerX + arrowWidth / 2 - lineThickness, centerY - lineThickness * 0.5)
  ctx.lineTo(centerX - arrowWidth / 2, centerY + arrowHeight / 2 - lineThickness)
  ctx.closePath()
  ctx.fill()

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping

  return texture
}

function createSmoothPoints(points: Vector3[], segments: number = 100): Vector3[] {
  if (points.length < 2) return points

  const smoothPoints: Vector3[] = []
  const curve = new CatmullRomCurve3(points)
  curve.curveType = 'catmullrom'
  curve.tension = 0.5

  for (let i = 0; i <= segments; i++) {
    smoothPoints.push(curve.getPoint(i / segments))
  }

  return smoothPoints
}

function createLineGeometry(
  points: Vector3[],
  width: number,
  axis: AxisType
): { geometry: BufferGeometry; totalLength: number } {
  const geometry = new BufferGeometry()

  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const smoothPoints = createSmoothPoints(points, 120)

  let totalLength = 0
  const lengths: number[] = [0]

  for (let i = 1; i < smoothPoints.length; i++) {
    const prev = smoothPoints[i - 1]
    const curr = smoothPoints[i]
    totalLength += new Vector3().subVectors(curr, prev).length()
    lengths.push(totalLength)
  }

  for (let i = 0; i < smoothPoints.length; i++) {
    const point = smoothPoints[i]
    const next = i < smoothPoints.length - 1 ? smoothPoints[i + 1] : smoothPoints[i]
    const prev = i > 0 ? smoothPoints[i - 1] : smoothPoints[i]

    let tangent = new Vector3().subVectors(next, prev).normalize()
    let normal: Vector3

    if (axis === AxisType.X) {
      normal = new Vector3(0, tangent.z, -tangent.y).normalize()
    } else if (axis === AxisType.Y) {
      normal = new Vector3(-tangent.z, 0, tangent.x).normalize()
    } else {
      normal = new Vector3(-tangent.y, tangent.x, 0).normalize()
    }

    const offset = normal.clone().multiplyScalar(width / 2)

    positions.push(
      point.x - offset.x, point.y - offset.y, point.z - offset.z,
      point.x + offset.x, point.y + offset.y, point.z + offset.z
    )

    const uvX = (lengths[i] / totalLength) / width
    uvs.push(uvX, 0, uvX, 1)

    if (i < smoothPoints.length - 1) {
      const base = i * 2
      indices.push(base, base + 1, base + 2)
      indices.push(base + 1, base + 3, base + 2)
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)

  return { geometry, totalLength }
}

function getLineMaterial(
  color: [number, number, number, number],
  arrowColor: [number, number, number],
  textureRepeat?: number
): { material: ShaderMaterial; texture: Texture } {
  const arrowTexture = createArrowTexture(arrowColor)
  
  const material = new ShaderMaterial({
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      time: { value: 0 },
      lineColor: { value: color },
      arrowColor: { value: arrowColor },
      arrowTexture: { value: arrowTexture },
      textureRepeat: { value: textureRepeat ?? 10 }
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec4 lineColor;
      uniform vec3 arrowColor;
      uniform sampler2D arrowTexture;
      uniform float textureRepeat;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;
        uv.x = fract(uv.x * textureRepeat - time);

        vec4 texColor = texture2D(arrowTexture, uv);

        float centerDist = abs(vUv.y - 0.5) * 2.0;

        float core = 1.0 - smoothstep(0.0, 0.5, centerDist);

        float glowGradient = 1.0 - smoothstep(0.3, 1.2, centerDist);

        float glowAlpha = glowGradient * (1.0 - centerDist / 1.5);

        float glow = core + glowAlpha * 0.8;

        float arrowBrightness = max(max(texColor.r, texColor.g), texColor.b);

        vec3 glowColor = lineColor.rgb * (1.2 + glowGradient * 0.3);

        vec3 finalColor = mix(glowColor, arrowColor * 1.3, arrowBrightness);
        float finalAlpha = glow * lineColor.a * (0.85 + 0.15 * arrowBrightness);

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `
  })
  
  return { material, texture: arrowTexture }
}

export default class FlowLineMesh extends Mesh {
  private flowMaterial!: ShaderMaterial
  private speed: number = 1
  private startTime: number = Date.now()

  constructor(options: FlowLineMeshOptions = {}) {
    const points = options.points ?? [
      new Vector3(-1, 0, 0),
      new Vector3(0, 0.5, 0),
      new Vector3(1, 0, 0)
    ]
    const width = options.width ?? 0.05
    const color = options.color ?? [0.086, 0.467, 1, 0.5]
    const arrowColor = options.arrowColor ?? [1, 1, 1]
    const axis = options.axis ?? AxisType.Z
    const textureRepeat = options.textureRepeat ?? 20
    const speed = options.speed ?? 4.0
    
    const { geometry } = createLineGeometry(points, width, axis)
    const { material } = getLineMaterial(color, arrowColor, textureRepeat)
    super(geometry, material)
    this.flowMaterial = material as ShaderMaterial
    this.speed = speed
    this.startAnimation()
  }

  private startAnimation() {
    this.startTime = Date.now()
    const animate = () => {
      const now = Date.now()
      const time = ((now - this.startTime) / 1000) * this.speed
      this.flowMaterial.uniforms.time.value = time
      requestAnimationFrame(animate)
    }
    animate()
  }
}