import { useEffect, useRef } from 'react'
import { useScene } from '../context/SceneContext'
import { mountBeachScene } from '../utils/BeachScene'
import type { BeachPresetName } from '../utils/BeachPresets'

export interface SandyBeachProps {
  /** Time-of-day preset. Defaults to `'sunrise'`. */
  preset?: BeachPresetName
  /** Walk forward automatically, without keyboard input. Defaults to `false`. */
  autoWalk?: boolean
  /** Lower the camera to a crouched eye height. Defaults to `false`. */
  crouching?: boolean
  /** Enables pointer look, WASD / arrow keys and wheel stepping. Defaults to `true`. */
  interactive?: boolean
}

/**
 * First-person dawn beach walk, a React Three Lite port of the Sunahama scene.
 *
 * The island is a 260 m ring: the sand height, the wet band, the footprints and
 * the ocean swells all share one set of shore coordinates, so the waterline,
 * the walker and the shader stay aligned at every angle. Only sand and water are
 * shaded, so the sky above the horizon is left to the Scene background colour.
 *
 * Drag to look around, walk with `WASD` / the arrow keys, and scroll to take a
 * step forward. Pass a `preset` to cross-fade between times of day.
 *
 * @see https://keensense.net/sunahama/
 */
const SandyBeach = ({
  preset = 'sunrise',
  autoWalk = false,
  crouching = false,
  interactive = true
}: SandyBeachProps) => {
  const sceneContext = useScene()

  // Props are read inside the animation loop, so changing them must not rebuild
  // the scene. Refs keep the latest values without re-running the effect.
  const presetRef = useRef<BeachPresetName>(preset)
  const autoWalkRef = useRef(autoWalk)
  const crouchingRef = useRef(crouching)
  const interactiveRef = useRef(interactive)

  useEffect(() => {
    presetRef.current = preset
    autoWalkRef.current = autoWalk
    crouchingRef.current = crouching
    interactiveRef.current = interactive
  })

  useEffect(
    () =>
      mountBeachScene(sceneContext, {
        preset: () => presetRef.current,
        autoWalk: () => autoWalkRef.current,
        crouching: () => crouchingRef.current,
        interactive: () => interactiveRef.current
      }),
    [sceneContext]
  )

  return null
}

export default SandyBeach
