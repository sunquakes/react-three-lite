import { vi } from 'vitest'

export interface FakeCanvasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface FakeCanvasOptions {
  /** Alpha written inside `rect`, default: 255 */
  alpha?: number
  /** Lit rectangle in canvas pixels, default: none (fully transparent canvas) */
  rect?: FakeCanvasRect
}

/**
 * jsdom ships without a 2D canvas implementation, so text sampling would throw
 * in unit tests. Replace `getContext('2d')` with a tiny fake that reports
 * deterministic `measureText` widths and returns a fixed alpha bitmap.
 *
 * Returns a restore function; call it in `afterEach`.
 */
export function installFakeCanvas(options: FakeCanvasOptions = {}): () => void {
  const { alpha = 255, rect } = options
  const original = HTMLCanvasElement.prototype.getContext

  const getContext = vi.fn(function (this: HTMLCanvasElement, type: string) {
    if (type !== '2d') return null

    const width = this.width
    const height = this.height
    const data = new Uint8ClampedArray(width * height * 4)

    if (rect) {
      const startX = Math.max(0, Math.floor(rect.x))
      const endX = Math.min(width, Math.ceil(rect.x + rect.width))
      const startY = Math.max(0, Math.floor(rect.y))
      const endY = Math.min(height, Math.ceil(rect.y + rect.height))

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          data[(y * width + x) * 4 + 3] = alpha
        }
      }
    }

    const context = {
      font: '10px sans-serif',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      fillStyle: '#000',
      measureText(text: string) {
        const match = /(\d+(?:\.\d+)?)px/.exec(context.font)
        const size = match ? Number.parseFloat(match[1]) : 10
        return { width: text.length * size * 0.55 }
      },
      fillText() {},
      clearRect() {},
      getImageData() {
        return { data, width, height }
      }
    }

    return context
  })

  HTMLCanvasElement.prototype.getContext = getContext as unknown as typeof HTMLCanvasElement.prototype.getContext

  return () => {
    HTMLCanvasElement.prototype.getContext = original
  }
}
