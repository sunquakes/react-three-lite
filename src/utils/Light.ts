import { Light, AmbientLight, Color } from 'three'

export default function (): Light {
  const light = new AmbientLight(0xffffff, 1)
  light.intensity = 5
  return light
}

/**
 * Gradient animation options for light transition.
 */
export interface LightGradientOptions {
  /** Target color (hex string or number) */
  color?: string | number
  /** Target intensity */
  intensity?: number
  /** Duration of the gradient animation in milliseconds */
  duration?: number
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Animate light properties from current values to target values.
 * @param light - The Three.js Light to animate
 * @param options - Target values and animation options
 * @returns Cleanup function to cancel the animation
 *
 * @example
 * ```tsx
 * import { lightGradient } from 'react-three-lite'
 *
 * const { sceneComponents } = useScene()
 * const cleanup = lightGradient(sceneComponents.light, {
 *   color: '#ff0000',
 *   intensity: 10,
 *   duration: 2000
 * })
 *
 * // Later, to cancel:
 * cleanup()
 * ```
 */
export function lightGradient(
  light: Light,
  options: LightGradientOptions
): () => void {
  const {
    color: targetColor,
    intensity: targetIntensity,
    duration = 1000,
    onComplete
  } = options

  const startColor = light.color.clone()
  const startIntensity = light.intensity

  const endColor = targetColor ? new Color(targetColor) : startColor.clone()
  const endIntensity = targetIntensity ?? startIntensity

  const startTime = performance.now()
  let animationId: number | null = null
  let completed = false

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Ease out cubic for smooth transition
    const easedProgress = 1 - Math.pow(1 - progress, 3)

    // Interpolate color
    light.color.copy(startColor).lerp(endColor, easedProgress)

    // Interpolate intensity
    light.intensity = startIntensity + (endIntensity - startIntensity) * easedProgress

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      completed = true
      animationId = null
      onComplete?.()
    }
  }

  animationId = requestAnimationFrame(animate)

  // Return cleanup function
  return () => {
    if (animationId !== null && !completed) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }
}
