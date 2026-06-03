import { useEffect, useRef, useCallback } from 'react'
import {
  Points,
  BufferGeometry,
  ShaderMaterial,
  Color,
  UniformsLib,
  Float32BufferAttribute,
  AdditiveBlending,
  CanvasTexture
} from 'three'
import { useScene } from '../context/SceneContext'

interface SnowProps {
  count?: number
  color?: string | number | Color
  speed?: number
  range?: number
  height?: number
  windX?: number
  windZ?: number
  opacity?: number
  size?: number
}

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHeightRange;
  uniform float uWindX;
  uniform float uWindZ;

  attribute float aSpeed;
  attribute vec3 aInitialPos;
  attribute float aPhase;
  attribute float aSize;

  varying float vAlpha;

  void main() {
    float t = mod(aInitialPos.y + uTime * aSpeed * uSpeed * 0.15, 1.0);

    vec3 pos = aInitialPos;
    pos.y = (1.0 - t) * uHeightRange - (uHeightRange * 0.5);
    
    float sway = sin(uTime * aSpeed + aPhase) * 0.3;
    float sway2 = cos(uTime * aSpeed * 0.7 + aPhase * 2.0) * 0.2;
    pos.x += uWindX * t * 2.0 + sway;
    pos.z += uWindZ * t * 2.0 + sway2;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float baseSize = 1.5 + aSize * 2.0;
    gl_PointSize = baseSize * (10.0 / -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 1.0 - smoothstep(0.0, 0.05, t) * 0.3 - smoothstep(0.95, 1.0, t) * 0.3;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform sampler2D uTexture;

  varying float vAlpha;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);

    float alpha = texColor.a * vAlpha * uOpacity;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor * texColor.rgb, alpha);
  }
`

const Snow = ({
  count = 3000,
  color = 0xffffff,
  speed = 0.5,
  range = 20,
  height = 15,
  windX = 0.2,
  windZ = 0.1,
  opacity = 0.9,
  size = 1
}: SnowProps) => {
  const sceneContext = useScene()
  const pointsRef = useRef<Points | null>(null)
  const materialRef = useRef<ShaderMaterial | null>(null)
  const clockRef = useRef(0)

  const animate = useCallback(() => {
    const material = materialRef.current
    if (!material) return
    clockRef.current += 0.016
    material.uniforms.uTime.value = clockRef.current
  }, [])

  useEffect(() => {
    const { scene, sceneComponents, addBeforeFrame } = sceneContext
    if (!scene || !sceneComponents?.camera) {
      return
    }

    const geometry = new BufferGeometry()

    const positions = new Float32Array(count * 3)
    const speedArr = new Float32Array(count)
    const initialPosArr = new Float32Array(count * 3)
    const phaseArr = new Float32Array(count)
    const sizeArr = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range
      const z = (Math.random() - 0.5) * range
      const y = Math.random()

      positions[i * 3] = x
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = z

      initialPosArr[i * 3] = x
      initialPosArr[i * 3 + 1] = y
      initialPosArr[i * 3 + 2] = z

      speedArr[i] = 0.3 + Math.random() * 0.7
      phaseArr[i] = Math.random() * 6.28318
      sizeArr[i] = Math.random()
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aSpeed', new Float32BufferAttribute(speedArr, 1))
    geometry.setAttribute('aInitialPos', new Float32BufferAttribute(initialPosArr, 3))
    geometry.setAttribute('aPhase', new Float32BufferAttribute(phaseArr, 1))
    geometry.setAttribute('aSize', new Float32BufferAttribute(sizeArr, 1))

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, 128, 128)

    const cx = 64
    const cy = 64
    const outerRadius = 60
    const innerRadius = 20

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(cx + innerRadius * cos, cy + innerRadius * sin)
      ctx.lineTo(cx + outerRadius * cos, cy + outerRadius * sin)
      ctx.stroke()

      const branchAngle1 = angle - Math.PI / 6
      const branchAngle2 = angle + Math.PI / 6
      const branchStart = outerRadius * 0.65
      const branchEnd = outerRadius * 0.9

      ctx.beginPath()
      ctx.moveTo(cx + branchStart * cos, cy + branchStart * sin)
      ctx.lineTo(cx + branchEnd * Math.cos(branchAngle1), cy + branchEnd * Math.sin(branchAngle1))
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(cx + branchStart * cos, cy + branchStart * sin)
      ctx.lineTo(cx + branchEnd * Math.cos(branchAngle2), cy + branchEnd * Math.sin(branchAngle2))
      ctx.stroke()
    }

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()

    const texture = new CanvasTexture(canvas)

    const material = new ShaderMaterial({
      uniforms: {
        ...UniformsLib.lights,
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uHeightRange: { value: height },
        uWindX: { value: windX },
        uWindZ: { value: windZ },
        uColor: { value: new Color(color) },
        uOpacity: { value: opacity },
        uTexture: { value: texture }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    })
    materialRef.current = material

    const points = new Points(geometry, material)
    points.name = 'Snow'
    pointsRef.current = points

    scene.add(points)

    addBeforeFrame?.(animate)

    return () => {
      geometry.dispose()
      material.dispose()
      if (pointsRef.current) {
        scene.remove(pointsRef.current)
        pointsRef.current = null
      }
    }
  }, [sceneContext, count, color, speed, range, height, windX, windZ, opacity, size, animate])

  return null
}

export default Snow
