import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Scene, Callout } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

export default function App() {
  const calloutRef = useRef<Callout | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera } = components
    if (!camera) return

    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)

    // A box at the origin that the annotation points to.
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    scene.add(box)

    // Callout: start (anchor) on the box surface, end (label) on the right side, further out.
    // autoAnchor makes the label's bottom-edge connection point follow the
    // camera — call attach(camera) once to start the internal rAF loop.
    const callout = new Callout(
      [0.5, 0.5, 0.5],                     // start (anchor) — box corner
      [1.5, 1.0, 0.5],                       // end (label) — further right of the box
      <div style={{
        padding: '8px 14px',
        background: 'linear-gradient(180deg, #ff8a2b 0%, #e66400 100%)',
        borderRadius: '4px',
        color: '#1a0f00',
        fontSize: '16px',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(255, 138, 43, 0.35)',
        pointerEvents: 'auto',
        whiteSpace: 'nowrap',
        userSelect: 'none'
      }}>This is a box!</div>,
      {
        color: '#ffffff',
        lineWidth: 2,
        lineShape: 'broken',
        bendAxis: 'x',
        bendRatio: 2 / 3,
        autoAnchor: true,                  // connection point follows camera
        dashed: false,
        showDot: true,
        dotColor: '#ffffff',
        dotRadius: 0.06
      }
    )
    scene.add(callout.scene!)
    callout.attach(camera)                 // start internal autoAnchor loop
    calloutRef.current = callout
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      calloutRef.current?.dispose()
      calloutRef.current = null
    }
  }, [])

  return (
    <Scene
      bgColor="#1a1a2e"
      style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '360px' }}
      onCreated={handleCreated}
    />
  )
}
