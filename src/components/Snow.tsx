import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  float,
  vec4,
  uv,
  attribute,
  positionLocal,
  modelViewMatrix,
  cameraProjectionMatrix,
  varying,
  mod,
  smoothstep,
  oneMinus,
  sin,
  cos,
  texture,
  viewportSize
} from 'three/tsl'
import { useScene } from '../context/SceneContext'

interface SnowProps {
  count?: number
  color?: string | number | THREE.Color
  speed?: number
  range?: number
  height?: number
  windX?: number
  windZ?: number
  opacity?: number
  size?: number
}

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
  const meshRef = useRef<THREE.Mesh | null>(null)
  const materialRef = useRef<NodeMaterial | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const timeUniformRef = useRef<ReturnType<typeof uniform> | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    const { scene, sceneComponents, renderer } = sceneContext
    if (!scene || !sceneComponents?.camera) {
      return
    }

    // Quad-based particle geometry: 4 vertices per particle, 6 indices per
    // particle. Each particle is a billboard quad; per-particle attributes are
    // repeated once per quad vertex so the vertex shader can read them.
    const quadCorners = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [-0.5, 0.5],
      [0.5, 0.5]
    ]
    const quadUVs = [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1]
    ]

    const positions = new Float32Array(count * 4 * 3)
    const uvs = new Float32Array(count * 4 * 2)
    const initialPosArr = new Float32Array(count * 4 * 3)
    const speedArr = new Float32Array(count * 4)
    const phaseArr = new Float32Array(count * 4)
    const sizeArr = new Float32Array(count * 4)

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range
      const z = (Math.random() - 0.5) * range
      const y = Math.random()
      const particleSpeed = 0.3 + Math.random() * 0.7
      const phase = Math.random() * 6.28318
      const particleSize = Math.random()

      for (let j = 0; j < 4; j++) {
        const vIdx = i * 4 + j
        // Quad corner position
        positions[vIdx * 3] = quadCorners[j][0]
        positions[vIdx * 3 + 1] = quadCorners[j][1]
        positions[vIdx * 3 + 2] = 0
        // UV
        uvs[vIdx * 2] = quadUVs[j][0]
        uvs[vIdx * 2 + 1] = quadUVs[j][1]
        // Per-particle data (same for all 4 vertices of the quad)
        initialPosArr[vIdx * 3] = x
        initialPosArr[vIdx * 3 + 1] = y
        initialPosArr[vIdx * 3 + 2] = z
        speedArr[vIdx] = particleSpeed
        phaseArr[vIdx] = phase
        sizeArr[vIdx] = particleSize
      }
    }

    // Indices: two triangles per quad
    const indices = new Uint32Array(count * 6)
    for (let i = 0; i < count; i++) {
      const base = i * 4
      const idx = i * 6
      indices[idx] = base
      indices[idx + 1] = base + 1
      indices[idx + 2] = base + 2
      indices[idx + 3] = base + 1
      indices[idx + 4] = base + 3
      indices[idx + 5] = base + 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setAttribute('aInitialPos', new THREE.Float32BufferAttribute(initialPosArr, 3))
    geometry.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speedArr, 1))
    geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phaseArr, 1))
    geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizeArr, 1))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometryRef.current = geometry

    // Hexagonal snowflake CanvasTexture
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
      const sinVal = Math.sin(angle)

      ctx.beginPath()
      ctx.moveTo(cx + innerRadius * cos, cy + innerRadius * sinVal)
      ctx.lineTo(cx + outerRadius * cos, cy + outerRadius * sinVal)
      ctx.stroke()

      const branchAngle1 = angle - Math.PI / 6
      const branchAngle2 = angle + Math.PI / 6
      const branchStart = outerRadius * 0.65
      const branchEnd = outerRadius * 0.9

      ctx.beginPath()
      ctx.moveTo(cx + branchStart * cos, cy + branchStart * sinVal)
      ctx.lineTo(cx + branchEnd * Math.cos(branchAngle1), cy + branchEnd * Math.sin(branchAngle1))
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(cx + branchStart * cos, cy + branchStart * sinVal)
      ctx.lineTo(cx + branchEnd * Math.cos(branchAngle2), cy + branchEnd * Math.sin(branchAngle2))
      ctx.stroke()
    }

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fill()

    const snowTexture = new THREE.CanvasTexture(canvas)

    // TSL uniforms
    const uTime = uniform(0)
    const uHeightRange = uniform(height)
    const uWindX = uniform(windX)
    const uWindZ = uniform(windZ)
    const uColor = uniform(new THREE.Color(color))
    // Custom TSL materials go through a linear to sRGB conversion on WebGPU
    // final output (making colors brighter), while WebGL writes the raw value
    // directly, so pre-correct on WebGPU to make both backends match.
    if (renderer?.isWebGPURenderer === true) {
      const brightness = 0.86
      const { r, g, b } = uColor.value
      uColor.value.setRGB(
        Math.pow(r, 2.2) * brightness,
        Math.pow(g, 2.2) * brightness,
        Math.pow(b, 2.2) * brightness
      )
    }
    const uOpacity = uniform(opacity)
    timeUniformRef.current = uTime

    // vAlpha varying shared between vertex and fragment
    const vAlpha = varying(float(0))

    const material = new NodeMaterial()
    material.transparent = true
    material.depthWrite = false
    material.blending = THREE.AdditiveBlending
    material.alphaTest = 0.01
    material.side = THREE.DoubleSide

    // Vertex shader: animate particle center with sway, billboard quad in clip space
    material.vertexNode = Fn(() => {
      const aInitialPos = attribute<'vec3'>('aInitialPos', 'vec3')
      const aSpeed = attribute<'float'>('aSpeed', 'float')
      const aPhase = attribute<'float'>('aPhase', 'float')
      const aSize = attribute<'float'>('aSize', 'float')

      const t = mod(aInitialPos.y.add(uTime.mul(aSpeed).mul(0.15)), 1.0)

      // Sway
      const sway = sin(uTime.mul(aSpeed).add(aPhase)).mul(0.3)
      const sway2 = cos(uTime.mul(aSpeed).mul(0.7).add(aPhase.mul(2.0))).mul(0.2)

      // Particle center
      const centerX = aInitialPos.x.add(uWindX.mul(t).mul(2.0)).add(sway)
      const centerY = oneMinus(t).mul(uHeightRange).sub(uHeightRange.mul(0.5))
      const centerZ = aInitialPos.z.add(uWindZ.mul(t).mul(2.0)).add(sway2)

      // View space center
      const centerView = modelViewMatrix.mul(vec4(centerX, centerY, centerZ, 1.0))
      // Clip space center
      const centerClip = cameraProjectionMatrix.mul(centerView)

      // Point size in physical pixels with distance attenuation
      // (matches the original gl_PointSize semantics)
      const baseSize = float(1.5).add(aSize.mul(2.0))
      const pointSize = baseSize.mul(float(10.0).div(centerView.z.negate()))

      // Billboard offset in clip space: convert pixel size to NDC per axis,
      // then compensate for the perspective divide (multiply by clip w).
      const ndcSizeX = pointSize.div(viewportSize.x.div(2.0))
      const ndcSizeY = pointSize.div(viewportSize.y.div(2.0))
      const offsetX = positionLocal.x.mul(ndcSizeX).mul(centerClip.w)
      const offsetY = positionLocal.y.mul(ndcSizeY).mul(centerClip.w)

      // vAlpha: fade in/out at top and bottom of travel
      vAlpha.assign(
        oneMinus(smoothstep(0.0, 0.05, t).mul(0.3)).sub(smoothstep(0.95, 1.0, t).mul(0.3))
      )

      return vec4(
        centerClip.x.add(offsetX),
        centerClip.y.add(offsetY),
        centerClip.z,
        centerClip.w
      )
    })()

    // Fragment shader: sample snowflake texture using UV coordinates
    material.fragmentNode = Fn(() => {
      const texColor = texture(snowTexture, uv())
      const alpha = texColor.a.mul(vAlpha).mul(uOpacity)
      return vec4(uColor.rgb.mul(texColor.rgb), alpha)
    })()

    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'Snow'
    mesh.frustumCulled = false
    meshRef.current = mesh

    scene.add(mesh)

    // Use a dedicated requestAnimationFrame loop instead of addBeforeFrame to
    // avoid triggering the Scene's beforeFrameSetRef render path (which skips
    // renderer.clear() and background — problematic on WebGPU).
    const animate = () => {
      const uTime = timeUniformRef.current
      if (uTime) {
        ;(uTime as { value: number }).value += 0.016 * speed
      }
      animationIdRef.current = requestAnimationFrame(animate)
    }
    animationIdRef.current = requestAnimationFrame(animate)

    // Cleanup on unmount
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      geometry.dispose()
      material.dispose()
      snowTexture.dispose()
      if (meshRef.current) {
        scene.remove(meshRef.current)
        meshRef.current = null
      }
      geometryRef.current = null
      materialRef.current = null
      timeUniformRef.current = null
    }
  }, [sceneContext, count, color, speed, range, height, windX, windZ, opacity, size])

  return null
}

export default Snow
