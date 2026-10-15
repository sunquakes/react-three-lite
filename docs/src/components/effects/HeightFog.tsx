import { Scene, HeightFog } from 'react-three-lite'

interface HeightFogProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function HeightFogComponent({ rendererType }: HeightFogProps) {
  return (
    <Scene rendererType={rendererType} bgColor="#1a1a2e" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }}>
      <HeightFog />
    </Scene>
  )
}
