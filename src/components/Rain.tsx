import { useEffect, useRef, useCallback } from 'react'
import {
  Points,
  BufferGeometry,
  ShaderMaterial,
  Color,
  UniformsLib,
  Float32BufferAttribute,
  AdditiveBlending
} from 'three'
import { useScene } from '../context/SceneContext'

interface RainProps {
  count?: number
  color?: string | number | Color
  speed?: number
  range?: number
  height?: number
  windX?: number
  windZ?: number
  opacity?: number
}

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHeightRange;
  uniform float uWindX;
  uniform float uWindZ;

  attribute float aSpeed;
  attribute vec3 aInitialPos;
  attribute float aScaleY;

  varying float vAlpha;

  void main() {
    float t = mod(aInitialPos.y + uTime * aSpeed * uSpeed * 0.3, 1.0);

    vec3 pos = aInitialPos;
    pos.y = (1.0 - t) * uHeightRange - (uHeightRange * 0.5);
    pos.x += uWindX * t * 2.0;
    pos.z += uWindZ * t * 2.0;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    float baseSize = 3.0 + aSpeed * 2.0;
    gl_PointSize = baseSize * (8.0 / -mvPosition.z);

    gl_Position = projectionMatrix * mvPosition;

    vAlpha = 1.0 - smoothstep(0.0, 0.05, t) * 0.5 - smoothstep(0.95, 1.0, t) * 0.5;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);

    coord.y += 0.15;

    float dist = length(coord * vec2(8.0, 1.0));

    float alpha = 1.0 - smoothstep(0.08, 0.3, dist);

    alpha *= vAlpha * uOpacity;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`

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
    const scaleYArr = new Float32Array(count)

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

      speedArr[i] = 0.5 + Math.random() * 0.5
      scaleYArr[i] = 2.0 + Math.random() * 2.0
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aSpeed', new Float32BufferAttribute(speedArr, 1))
    geometry.setAttribute('aInitialPos', new Float32BufferAttribute(initialPosArr, 3))
    geometry.setAttribute('aScaleY', new Float32BufferAttribute(scaleYArr, 1))

    const material = new ShaderMaterial({
      uniforms: {
        ...UniformsLib.lights,
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uHeightRange: { value: height },
        uWindX: { value: windX },
        uWindZ: { value: windZ },
        uColor: { value: new Color(color) },
        uOpacity: { value: opacity }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    })
    materialRef.current = material

    const points = new Points(geometry, material)
    points.name = 'Rain'
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
  }, [sceneContext, count, color, speed, range, height, windX, windZ, opacity, animate])

  return null
}

export default Rain
