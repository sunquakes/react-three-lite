import React from 'react'
import { Scene } from 'react-three-lite'
import type * as THREE from 'three'
import type { SceneComponents } from 'react-three-lite'

interface SceneBgImageComponentProps {
  style?: React.CSSProperties
  rendererType?: 'webgpu' | 'webgl'
}

export default function SceneBgImageComponent({ style, rendererType }: SceneBgImageComponentProps) {
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
      rendererType={rendererType}
      bgImage="/images/examples/bg.jpg"
      gridHelper={false}
      onCreated={handleCreated}
    />
  )
}