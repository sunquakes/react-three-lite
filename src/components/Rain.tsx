import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  float,
  vec2,
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
  length,
  viewportSize
} from 'three/tsl'
import { useScene } from '../context/SceneContext'

interface RainProps {
  count?: number
  color?: string | number | THREE.Color
  speed?: number
  range?: number
  height?: number
  windX?: number
  windZ?: number
  opacity?: number
}

const Rain = ({
  count = 4000,
  color = 0xb0c4de,
  speed = 1,
  range = 20,
  height = 15,
  windX = 0.1,
  windZ = 0,
  opacity = 0.8
}: RainProps) => {
  const sceneContext = useScene()
  const meshRef = useRef<THREE.Mesh | null>(null)
  const materialRef = useRef<NodeMaterial | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const timeUniformRef = useRef<ReturnType<typeof uniform> | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    const { scene, sceneComponents } = sceneContext
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

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range
      const z = (Math.random() - 0.5) * range
      const y = Math.random()
      const particleSpeed = 0.5 + Math.random() * 0.5

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
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometryRef.current = geometry

    // TSL uniforms
    const uTime = uniform(0)
    const uHeightRange = uniform(height)
    const uWindX = uniform(windX)
    const uWindZ = uniform(windZ)
    const uColor = uniform(new THREE.Color(color))
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

    // Vertex shader: animate particle center, billboard quad in clip space
    material.vertexNode = Fn(() => {
      const aInitialPos = attribute<'vec3'>('aInitialPos', 'vec3')
      const aSpeed = attribute<'float'>('aSpeed', 'float')

      const t = mod(aInitialPos.y.add(uTime.mul(aSpeed).mul(0.3)), 1.0)

      // Particle center in local space
      const centerX = aInitialPos.x.add(uWindX.mul(t).mul(2.0))
      const centerY = oneMinus(t).mul(uHeightRange).sub(uHeightRange.mul(0.5))
      const centerZ = aInitialPos.z.add(uWindZ.mul(t).mul(2.0))

      // Transform center to view space
      const centerView = modelViewMatrix.mul(vec4(centerX, centerY, centerZ, 1.0))
      // Clip space center
      const centerClip = cameraProjectionMatrix.mul(centerView)

      // Point size in physical pixels with distance attenuation
      // (matches the original gl_PointSize semantics)
      const baseSize = float(4.0).add(aSpeed.mul(3.0))
      const pointSize = baseSize.mul(float(10.0).div(centerView.z.negate()))

      // Billboard offset in clip space: convert pixel size to NDC per axis,
      // then compensate for the perspective divide (multiply by clip w).
      const ndcSizeX = pointSize.div(viewportSize.x.div(2.0))
      const ndcSizeY = pointSize.div(viewportSize.y.div(2.0))
      const offsetX = positionLocal.x.mul(ndcSizeX).mul(centerClip.w)
      const offsetY = positionLocal.y.mul(ndcSizeY).mul(centerClip.w)

      // vAlpha varying: fade in/out at top and bottom of travel
      vAlpha.assign(
        oneMinus(smoothstep(0.0, 0.05, t).mul(0.5)).sub(smoothstep(0.95, 1.0, t).mul(0.5))
      )

      return vec4(
        centerClip.x.add(offsetX),
        centerClip.y.add(offsetY),
        centerClip.z,
        centerClip.w
      )
    })()

    // Fragment shader: rain drop shape using UV coordinates
    material.fragmentNode = Fn(() => {
      const coord = uv().sub(0.5)
      const distCoord = vec2(coord.x.mul(8.0), coord.y.add(0.15))
      const dist = length(distCoord)
      const alpha = oneMinus(smoothstep(0.08, 0.3, dist))
      const finalAlpha = alpha.mul(vAlpha).mul(uOpacity)
      return vec4(uColor.rgb, finalAlpha)
    })()

    materialRef.current = material

    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'Rain'
    // Geometry's position attribute holds quad corner offsets (-0.5 to 0.5),
    // but particles are spread across `range`. Disable frustum culling so the
    // mesh is not incorrectly culled by its tiny bounding box.
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
      if (meshRef.current) {
        scene.remove(meshRef.current)
        meshRef.current = null
      }
      geometryRef.current = null
      materialRef.current = null
      timeUniformRef.current = null
    }
  }, [sceneContext, count, color, speed, range, height, windX, windZ, opacity])

  return null
}

export default Rain
