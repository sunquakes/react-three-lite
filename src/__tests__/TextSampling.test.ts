import { afterEach, describe, expect, it } from 'vitest'
import { layoutText, sampleTextParticles } from '../utils/TextSampling'
import { installFakeCanvas } from './helpers/fakeCanvas'

const measure = (text: string, fontSize: number): number => text.length * fontSize * 0.55

describe('layoutText', () => {
  it('keeps short text on a single line at the base font size', () => {
    const layout = layoutText(
      'Hello',
      { width: 1288, baseFontSize: 168, minFontSize: 56, maxLines: 2 },
      measure
    )

    expect(layout.lines).toEqual(['Hello'])
    expect(layout.fontSize).toBe(168)
  })

  it('wraps English text on spaces without splitting words', () => {
    const layout = layoutText(
      'Good things are coming',
      { width: 1288, baseFontSize: 168, minFontSize: 56, maxLines: 2 },
      measure
    )

    expect(layout.lines).toEqual(['Good things', 'are coming'])
    expect(layout.fontSize).toBe(168)
  })

  it('breaks Chinese text between characters', () => {
    const layout = layoutText(
      '好事正在发生',
      { width: 500, baseFontSize: 168, minFontSize: 56, maxLines: 2 },
      measure
    )

    expect(layout.lines).toHaveLength(2)
    expect(layout.lines.join('')).toBe('好事正在发生')
  })

  it('shrinks the font until the text fits the line budget', () => {
    const layout = layoutText(
      'Good things are coming',
      { width: 1288, baseFontSize: 168, minFontSize: 56, maxLines: 1 },
      measure
    )

    expect(layout.lines).toEqual(['Good things are coming'])
    expect(layout.fontSize).toBeLessThan(168)
    expect(measure(layout.lines[0], layout.fontSize)).toBeLessThanOrEqual(1288)
  })

  it('returns no lines for blank text', () => {
    const layout = layoutText(
      '   ',
      { width: 1288, baseFontSize: 168, minFontSize: 56, maxLines: 2 },
      measure
    )

    expect(layout.lines).toEqual([])
  })
})

describe('sampleTextParticles', () => {
  let restoreCanvas: (() => void) | null = null

  afterEach(() => {
    restoreCanvas?.()
    restoreCanvas = null
  })

  it('spawns one particle per lit pixel on the sampling grid', () => {
    // 40x20 canvas, lit rectangle x 8..32 and y 4..16, sampling step 2.
    restoreCanvas = installFakeCanvas({ rect: { x: 8, y: 4, width: 24, height: 12 } })

    const sample = sampleTextParticles('Hi', {
      canvasWidth: 40,
      canvasHeight: 20,
      sampleStep: 2,
      worldScale: 0.01,
      offsetY: 0
    })

    // x = 9, 11, ... 31 (12 columns) and y = 5, 7, ... 15 (6 rows)
    expect(sample.count).toBe(72)
    expect(sample.positions).toHaveLength(sample.count * 3)
  })

  it('converts samples into world units around the text centre', () => {
    restoreCanvas = installFakeCanvas({ rect: { x: 8, y: 4, width: 24, height: 12 } })

    const sample = sampleTextParticles('Hi', {
      canvasWidth: 40,
      canvasHeight: 20,
      sampleStep: 2,
      worldScale: 0.01,
      offsetY: 0.55
    })

    for (let i = 0; i < sample.count; i += 1) {
      const x = sample.positions[i * 3]
      const y = sample.positions[i * 3 + 1]
      const z = sample.positions[i * 3 + 2]

      expect(x).toBeGreaterThanOrEqual(-0.12)
      expect(x).toBeLessThanOrEqual(0.12)
      expect(y).toBeGreaterThan(0.55 - 0.06)
      expect(y).toBeLessThan(0.55 + 0.06)
      expect(z).toBe(0)
    }
  })

  it('ignores transparent pixels and reports an empty cloud', () => {
    restoreCanvas = installFakeCanvas()

    const sample = sampleTextParticles('Hi', { canvasWidth: 40, canvasHeight: 20, sampleStep: 2 })

    expect(sample.count).toBe(0)
    expect(sample.positions).toHaveLength(0)
  })

  it('throws when no 2D context is available', () => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as unknown as typeof HTMLCanvasElement.prototype.getContext

    try {
      expect(() => sampleTextParticles('Hi')).toThrow(/2D canvas context/)
    } finally {
      HTMLCanvasElement.prototype.getContext = original
    }
  })
})
