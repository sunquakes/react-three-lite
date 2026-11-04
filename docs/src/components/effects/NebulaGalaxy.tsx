import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { NebulaGalaxy, Scene } from 'react-three-lite'
import type { GalaxyPalette, SceneComponents } from 'react-three-lite'

interface NebulaGalaxyProps {
  rendererType?: 'webgpu' | 'webgl'
}

const PALETTES: Array<{ value: GalaxyPalette; label: string; swatch: string }> = [
  {
    value: 'violet-gold',
    label: 'Violet gold',
    swatch: 'linear-gradient(135deg, #ffe0a8, #b07cff 55%, #4a7dff)'
  },
  {
    value: 'aurora',
    label: 'Aurora',
    swatch: 'linear-gradient(135deg, #d6fff2, #35e0a8 55%, #4f8bff)'
  },
  {
    value: 'warm-flame',
    label: 'Warm flame',
    swatch: 'linear-gradient(135deg, #fff0c0, #ff9448 55%, #ff4d6d)'
  }
]

export default function App({ rendererType }: NebulaGalaxyProps) {
  const effectRef = useRef<NebulaGalaxy | null>(null)
  const [palette, setPalette] = useState<GalaxyPalette>('violet-gold')
  const [speed, setSpeed] = useState(1)
  const [paused, setPaused] = useState(false)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls, gridHelper } = components

    camera.position.set(0, 2.6, 11)
    camera.lookAt(0, 0, 0)

    // The galaxy owns the pointer, so the orbit controls stay out of the way.
    controls.enabled = false
    if (gridHelper) gridHelper.visible = false

    const effect = new NebulaGalaxy({ palette, speed })
    scene.add(effect)
    effectRef.current = effect
  }

  useEffect(() => {
    effectRef.current?.setPalette(palette)
  }, [palette])

  useEffect(() => {
    effectRef.current?.setSpeed(speed)
  }, [speed])

  useEffect(() => {
    effectRef.current?.setPaused(paused)
  }, [paused])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      effectRef.current?.dispose()
      effectRef.current = null
    }
  }, [])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          marginTop: '10px'
        }}
      >
        {PALETTES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setPalette(item.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              borderRadius: '999px',
              cursor: 'pointer',
              color: 'var(--ifm-font-color-base)',
              background: 'var(--ifm-background-color)',
              border: `1px solid ${
                palette === item.value
                  ? 'var(--ifm-color-primary)'
                  : 'var(--ifm-color-emphasis-300)'
              }`
            }}
          >
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: item.swatch
              }}
            />
            {item.label}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          Speed
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            style={{ width: '90px' }}
          />
        </label>
        <button
          type="button"
          className="button button--primary button--sm"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div style={{ marginTop: '6px', fontSize: '12px', opacity: 0.6 }}>
        Drag to tilt the disc, scroll or pinch to zoom, click for a light wave.
      </div>
      <Scene
        rendererType={rendererType}
        bgColor="rgb(40, 42, 54)"
        style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}
        onCreated={handleCreated}
      />
    </div>
  )
}
