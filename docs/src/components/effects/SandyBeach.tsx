import { useState } from 'react'
import type { CSSProperties } from 'react'
import { SandyBeach, Scene } from 'react-three-lite'
import type { BeachPresetName } from 'react-three-lite'

interface SandyBeachProps {
  rendererType?: 'webgpu' | 'webgl'
}

const PRESETS: Array<{ value: BeachPresetName; label: string }> = [
  { value: 'sunrise', label: 'Sunrise' },
  { value: 'morning', label: 'Morning' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'blueHour', label: 'Blue hour' },
  { value: 'night', label: 'Night' }
]

const pillStyle = (active: boolean): CSSProperties => ({
  padding: '4px 11px',
  font: '500 12px system-ui, -apple-system, sans-serif',
  color: '#f5f5f5',
  cursor: 'pointer',
  borderRadius: '999px',
  border: active ? '1px solid rgba(255, 255, 255, 0.75)' : '1px solid rgba(255, 255, 255, 0.18)',
  background: active ? 'rgba(255, 255, 255, 0.22)' : 'rgba(40, 40, 40, 0.35)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  transition: 'background 160ms ease, border-color 160ms ease'
})

export default function App({ rendererType }: SandyBeachProps) {
  const [preset, setPreset] = useState<BeachPresetName>('sunrise')
  const [walking, setWalking] = useState(false)
  const [crouching, setCrouching] = useState(false)
  const [shared, setShared] = useState(false)

  const share = () => {
    const url = window.location.href
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => undefined)
    }
    setShared(true)
    window.setTimeout(() => setShared(false), 1600)
  }

  return (
    <div
      style={{
        position: 'relative',
        marginTop: '10px',
        marginBottom: '16px',
        width: '100%',
        height: '300px'
      }}
    >
      <Scene
        rendererType={rendererType}
        bgColor="rgb(40, 42, 54)"
        style={{ width: '100%', height: '100%' }}
      >
        <SandyBeach preset={preset} autoWalk={walking} crouching={crouching} />
      </Scene>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '12px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '6px',
          width: 'calc(100% - 24px)',
          pointerEvents: 'none'
        }}
      >
        {PRESETS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setPreset(item.value)}
            style={{ ...pillStyle(preset === item.value), pointerEvents: 'auto' }}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setWalking((value) => !value)}
          style={{ ...pillStyle(walking), pointerEvents: 'auto' }}
        >
          Walk
        </button>
        <button
          type="button"
          onClick={() => setCrouching((value) => !value)}
          style={{ ...pillStyle(crouching), pointerEvents: 'auto' }}
        >
          Crouch
        </button>
        <button type="button" onClick={share} style={{ ...pillStyle(false), pointerEvents: 'auto' }}>
          {shared ? 'Copied' : 'Share'}
        </button>
      </div>
    </div>
  )
}
