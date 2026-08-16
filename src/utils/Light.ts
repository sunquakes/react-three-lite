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
 *
 * @example
 * ```tsx
 * import { LightGradient } from 'react-three-lite'
 *
 * const gradient = new LightGradient(light, {
 *   color: '#ff0000',
 *   intensity: 10,
 *   duration: 2000
 * })
 *
 * // Later, to cancel:
 * gradient.dispose()
 * ```
 */
export class LightGradient {
  private light: Light
  private startColor: Color
  private endColor: Color
  private startIntensity: number
  private endIntensity: number
  private duration: number
  private startTime: number
  private animationId: number | null = null
  private completed = false
  private onComplete?: () => void

  constructor(light: Light, options: LightGradientOptions = {}) {
    const {
      color: targetColor,
      intensity: targetIntensity,
      duration = 1000,
      onComplete
    } = options

    this.light = light
    this.startColor = light.color.clone()
    this.startIntensity = light.intensity
    this.endColor = targetColor ? new Color(targetColor) : this.startColor.clone()
    this.endIntensity = targetIntensity ?? this.startIntensity
    this.duration = duration
    this.startTime = performance.now()
    this.onComplete = onComplete

    this.animate()
  }

  private animate = () => {
    const elapsed = performance.now() - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)

    // Ease out cubic for smooth transition
    const easedProgress = 1 - Math.pow(1 - progress, 3)

    // Interpolate color
    this.light.color.copy(this.startColor).lerp(this.endColor, easedProgress)

    // Interpolate intensity
    this.light.intensity =
      this.startIntensity + (this.endIntensity - this.startIntensity) * easedProgress

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.animate)
    } else {
      this.completed = true
      this.animationId = null
      this.onComplete?.()
    }
  }

  /**
   * Stop the gradient animation and release resources.
   */
  dispose(): void {
    if (this.animationId !== null && !this.completed) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}
