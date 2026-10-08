import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useScene } from '../context/SceneContext'
import { ensureSceneGeo } from '../crs/SceneGeo'
import type { DatumType, GeoPoint } from '../crs/types'

export interface GeoObjectProps {
  /** Geographic position of the anchor, in the datum declared by `datum`. */
  coordinate: GeoPoint
  /** Datum of the input coordinate. Defaults to the Scene's configured datum. */
  datum?: DatumType
  /**
   * Existing object to anchor. Ownership stays with the caller: the component
   * only reparents it and restores the original parent on unmount. When
   * omitted, an empty Group is created and handed to `onReady`.
   */
  object?: THREE.Object3D
  /** Called once with the anchored object (created Group or supplied object). */
  onReady?: (object: THREE.Object3D) => void
  /** Optional explicit scene; defaults to the Scene provided by context. */
  scene?: THREE.Scene
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    mesh.geometry?.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) {
      material.forEach((m) => m.dispose())
    } else {
      material?.dispose()
    }
  })
}

const GeoObject = ({
  coordinate,
  datum,
  object: propObject,
  onReady,
  scene: propScene
}: GeoObjectProps) => {
  const sceneContext = useScene()
  const groupRef = useRef<THREE.Object3D | null>(null)
  const ownedRef = useRef(false)
  const originalParentRef = useRef<THREE.Object3D | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = () => {
      const scene = propScene || sceneContext?.scene
      if (!scene) {
        // The Scene context is published asynchronously after the renderer
        // starts; retry briefly in the same way as the model loaders.
        if (!cancelled) setTimeout(init, 100)
        return
      }

      const object = propObject ?? new THREE.Group()
      ownedRef.current = !propObject
      originalParentRef.current = object.parent
      // R3L scenes already carry setPosition; a user-supplied bare scene is
      // bound here without a reference, so lng/lat/alt fall back to local
      // metres exactly as the previous manual positioning branch did.
      ensureSceneGeo(scene)
      scene.setPosition(object, coordinate, datum)
      scene.add(object)
      groupRef.current = object
      onReady?.(object)
    }

    init()

    return () => {
      cancelled = true
      const object = groupRef.current
      if (object) {
        // Restore the caller's parent when an external object was supplied;
        // dispose everything when the Group was created internally.
        const originalParent = originalParentRef.current
        if (originalParent && !ownedRef.current) {
          originalParent.add(object)
        } else {
          object.removeFromParent()
          if (ownedRef.current) disposeObject(object)
        }
      }
      groupRef.current = null
      originalParentRef.current = null
      ownedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propScene, sceneContext?.scene, propObject])

  // Keep the anchor position in sync with prop changes without rebuilding.
  useEffect(() => {
    const object = groupRef.current
    const scene = propScene || sceneContext?.scene
    if (object && scene) {
      ensureSceneGeo(scene)
      scene.setPosition(object, coordinate, datum)
    }
  }, [coordinate, datum, propScene, sceneContext?.scene])

  return null
}

export default GeoObject
