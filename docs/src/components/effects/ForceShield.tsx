import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Scene, ForceShield } from 'react-three-lite'
import type { SceneComponents } from 'react-three-lite'

interface ForceShieldProps {
  rendererType?: 'webgpu' | 'webgl'
}

export default function ForceShieldComponent({ rendererType }: ForceShieldProps) {
  const shieldRef = useRef<ForceShield | null>(null)
  const timerRef = useRef<number | null>(null)
  const removeListenerRef = useRef<(() => void) | null>(null)

  const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
    const { camera, controls } = components
    camera.position.set(0, 0.8, 4.6)
    camera.lookAt(0, 0, 0)

    const shield = new ForceShield({ radius: 1.8, hitDamage: 3 })
    scene.add(shield)
    shieldRef.current = shield

    // Clicking the field fires an impact where the ray hits it.
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const handlePointerDown = (event: PointerEvent) => {
      const canvas = controls.domElement
      const rect = canvas.getBoundingClientRect()
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(pointer, camera)
      shield.hit(raycaster.intersectObject(shield)[0]?.point)
    }

    controls.domElement.addEventListener('pointerdown', handlePointerDown)
    removeListenerRef.current = () => {
      controls.domElement.removeEventListener('pointerdown', handlePointerDown)
    }

    // Automatic impacts keep the demo moving; the shield resets once depleted.
    timerRef.current = window.setInterval(() => {
      shield.hit()
      if (shield.life < 0.6) shield.life = 1
    }, 1400)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeListenerRef.current?.()
      removeListenerRef.current = null

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      shieldRef.current?.dispose()
      shieldRef.current = null
    }
  }, [])

  return (
    <Scene rendererType={rendererType} bgColor="rgb(40, 42, 54)" style={{ marginTop: '10px', marginBottom: '16px', width: '100%', height: '300px' }} onCreated={handleCreated} />
  )
}
