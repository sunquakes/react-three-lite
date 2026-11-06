import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Rain, Scene } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface RainCollisionProps {
  rendererType?: 'webgpu' | 'webgl'
}

const TERRAIN_SIZE = 40
const MAP_RESOLUTION = 256
const RAIN_HEIGHT = 24
const HEIGHT_MAP_AMPLITUDE = RAIN_HEIGHT * 0.4
const GROUND_Y = -RAIN_HEIGHT / 2

function hash(x: number, y: number, seed: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)

  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)

  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v
}

/**
 * Deterministic grayscale height field (row 0 is the top of the image) used both
 * as the Rain height map and as the terrain displacement, so drops always land
 * exactly on the rendered surface.
 */
function createHeightField(size: number) {
  const field = new Float32Array(size * size)

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const u = col / size
      const v = row / size
      let height = 0
      let amplitude = 0.55
      let frequency = 3

      for (let octave = 0; octave < 3; octave++) {
        height += valueNoise(u * frequency, v * frequency, octave * 17) * amplitude
        amplitude *= 0.5
        frequency *= 2
      }

      height += Math.sin(u * Math.PI * 2) * Math.cos(v * Math.PI * 2) * 0.12
      field[row * size + col] = THREE.MathUtils.clamp(height, 0, 1)
    }
  }

  return field
}

function createHeightMapTexture(field: Float32Array, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)

  for (let i = 0; i < field.length; i++) {
    const value = Math.round(field[i] * 255)
    image.data[i * 4] = value
    image.data[i * 4 + 1] = value
    image.data[i * 4 + 2] = value
    image.data[i * 4 + 3] = 255
  }

  ctx.putImageData(image, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export default function App({ rendererType }: RainCollisionProps) {
  const terrainRef = useRef<THREE.Mesh | null>(null)
  const heightMapRef = useRef<THREE.CanvasTexture | null>(null)
  const [heightMap, setHeightMap] = useState<THREE.CanvasTexture | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components
    camera.position.set(0, 8, 27)
    controls.target.set(0, -3, 0)
    controls.update()

    const field = createHeightField(MAP_RESOLUTION)
    const texture = createHeightMapTexture(field, MAP_RESOLUTION)
    heightMapRef.current = texture

    // Terrain displaced by the same height field, sampled with the plane's own
    // UVs (the Rain component maps its height map the same way).
    const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 160, 160)
    geometry.rotateX(-Math.PI / 2)
    const positions = geometry.attributes.position
    const uvAttribute = geometry.attributes.uv
    const colors = new Float32Array(positions.count * 3)
    const lowColor = new THREE.Color('#1b2230')
    const highColor = new THREE.Color('#55647d')
    const color = new THREE.Color()

    for (let i = 0; i < positions.count; i++) {
      const u = uvAttribute.getX(i)
      const v = uvAttribute.getY(i)
      const col = THREE.MathUtils.clamp(
        Math.round(u * (MAP_RESOLUTION - 1)),
        0,
        MAP_RESOLUTION - 1
      )
      const row = THREE.MathUtils.clamp(
        Math.round((1 - v) * (MAP_RESOLUTION - 1)),
        0,
        MAP_RESOLUTION - 1
      )
      const sample = field[row * MAP_RESOLUTION + col]

      positions.setY(i, GROUND_Y + sample * HEIGHT_MAP_AMPLITUDE)
      color.copy(lowColor).lerp(highColor, sample)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    positions.needsUpdate = true
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05
    })
    const terrain = new THREE.Mesh(geometry, material)
    terrain.name = 'RainCollisionTerrain'
    scene.add(terrain)
    terrainRef.current = terrain

    setHeightMap(texture)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const terrain = terrainRef.current
      if (terrain) {
        terrain.geometry.dispose()
        ;(terrain.material as THREE.Material).dispose()
        terrain.removeFromParent()
        terrainRef.current = null
      }
      heightMapRef.current?.dispose()
      heightMapRef.current = null
    }
  }, [])

  return (
    <Scene
      rendererType={rendererType}
      onCreated={handleCreated}
      // The displaced terrain replaces the default ground helpers.
      axesHelper={false}
      gridHelper={false}
      bgColor="rgb(28, 30, 40)"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
    >
      {heightMap ? (
        <Rain
          count={5000}
          speed={1}
          range={TERRAIN_SIZE}
          height={RAIN_HEIGHT}
          windX={0.12}
          windZ={0.05}
          color={0x9fc6e8}
          opacity={0.85}
          heightMap={heightMap}
          heightMapSize={TERRAIN_SIZE}
          heightMapAmplitude={HEIGHT_MAP_AMPLITUDE}
          groundHeight={GROUND_Y}
          splashSize={1}
          splashDuration={0.7}
        />
      ) : null}
    </Scene>
  )
}
