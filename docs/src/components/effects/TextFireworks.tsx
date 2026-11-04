import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Scene, TextFireworks } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface TextFireworksProps {
  rendererType?: 'webgpu' | 'webgl'
}

const DEFAULT_TEXT = 'Good things are coming'

export default function App({ rendererType }: TextFireworksProps) {
  const effectRef = useRef<TextFireworks | null>(null)
  const [text, setText] = useState(DEFAULT_TEXT)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1, 6)
    camera.lookAt(0, 1, 0)

    const effect = new TextFireworks({ text: DEFAULT_TEXT })
    scene.add(effect)
    effectRef.current = effect
  }

  const handleLaunch = () => {
    const effect = effectRef.current
    if (!effect) return

    // Sampling a new sentence rebuilds the particles, then replay the cycle.
    effect.setText(text)
    effect.launch()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      effectRef.current?.dispose()
      effectRef.current = null
    }
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a sentence"
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid var(--ifm-color-emphasis-300)',
            background: 'var(--ifm-background-color)',
            color: 'var(--ifm-font-color-base)'
          }}
        />
        <button type="button" className="button button--primary" onClick={handleLaunch}>
          Launch
        </button>
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
