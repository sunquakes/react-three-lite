import { Scene } from 'react-three-lite'
import type * as THREE from 'three'
import type { SceneComponents } from 'react-three-lite'

interface SceneBgColorComponentProps {
  style?: React.CSSProperties
}

export default function SceneBgColorComponent({ style }: SceneBgColorComponentProps) {
  const defaultStyle: React.CSSProperties = {
    marginTop: '10px',
    marginBottom: '16px',
    width: '100%',
    height: '300px'
  }

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    camera.position.set(0, 1.5, 3)
  }

  return (
    <Scene
      style={{ ...defaultStyle, ...style }}
      bgColor="#98F5F9"
      onCreated={handleCreated}
    />
  )
}