import { vi } from 'vitest'

export interface FakeRaf {
  /** Frame callbacks that have been requested but not run yet. */
  pending: Map<number, FrameRequestCallback>
  /** Run every pending callback once with the given timestamp. */
  flush: (timestamp?: number) => void
  request: ReturnType<typeof vi.fn>
  cancel: ReturnType<typeof vi.fn>
}

/**
 * Replace requestAnimationFrame / cancelAnimationFrame with synchronous fakes.
 *
 * Almost every animated class in this library starts its own frame loop from the
 * constructor, so real frames would keep running after a test finishes and leak
 * into the next one. Collecting the callbacks instead of executing them also
 * lets a test advance the loop exactly one frame at a time with a timestamp it
 * controls.
 *
 * Call `vi.unstubAllGlobals()` in `afterEach` to restore the originals.
 */
export function installFakeRaf(): FakeRaf {
  const pending = new Map<number, FrameRequestCallback>()
  let nextId = 1

  const request = vi.fn((callback: FrameRequestCallback) => {
    const id = nextId++
    pending.set(id, callback)
    return id
  })

  const cancel = vi.fn((id: number) => {
    pending.delete(id)
  })

  vi.stubGlobal('requestAnimationFrame', request)
  vi.stubGlobal('cancelAnimationFrame', cancel)

  return {
    pending,
    request,
    cancel,
    flush(timestamp = 0) {
      // Snapshot and clear first: the callbacks re-register themselves, so
      // iterating the live map would never terminate.
      const callbacks = [...pending.values()]
      pending.clear()
      callbacks.forEach((callback) => callback(timestamp))
    }
  }
}
