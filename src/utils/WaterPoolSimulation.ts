import * as THREE from 'three'

/**
 * CPU height-field simulation for the interactive water pool.
 *
 * The pool occupies the XZ square [-1, 1] and its floor is at y = -1. Each cell
 * stores the surface height and its vertical velocity together with the surface
 * normal, which is uploaded to the GPU as a half float texture.
 */
export interface WaterPoolSimulationOptions {
  /** Height-field cells per axis. */
  resolution?: number
  /** Velocity attenuation applied on every step. */
  damping?: number
  /** How strongly a cell is pulled towards the average of its neighbours. */
  propagation?: number
}

export const WATER_POOL_HALF_SIZE = 1
export const WATER_POOL_FLOOR_Y = -1
export const WATER_POOL_SURFACE_Y = 0

const MIN_RESOLUTION = 8
const MAX_RESOLUTION = 512

const clampResolution = (value: number) =>
  Math.min(MAX_RESOLUTION, Math.max(MIN_RESOLUTION, Math.round(value)))

/**
 * Height-field simulation with ripple propagation.
 */
export class WaterPoolSimulation {
  readonly resolution: number
  /** Surface height per cell, in world units. */
  readonly heights: Float32Array
  /** Vertical velocity per cell. */
  readonly velocities: Float32Array
  /** X component of the surface normal per cell. */
  readonly normalX: Float32Array
  /** Z component of the surface normal per cell. */
  readonly normalZ: Float32Array
  /** RGBA half float texels: height, velocity, normal.x, normal.z. */
  readonly waterTextureData: Uint16Array

  private readonly nextVelocities: Float32Array
  private readonly spacing: number
  private readonly damping: number
  private readonly propagation: number

  constructor(options: WaterPoolSimulationOptions = {}) {
    this.resolution = clampResolution(options.resolution ?? 128)
    this.damping = options.damping ?? 0.995
    this.propagation = options.propagation ?? 2

    const cells = this.resolution * this.resolution

    this.heights = new Float32Array(cells)
    this.velocities = new Float32Array(cells)
    this.normalX = new Float32Array(cells)
    this.normalZ = new Float32Array(cells)
    this.nextVelocities = new Float32Array(cells)

    this.waterTextureData = new Uint16Array(cells * 4)

    this.spacing = (WATER_POOL_HALF_SIZE * 2) / (this.resolution - 1)

    this.reset()
  }

  /** Clears the surface. */
  reset(): void {
    this.heights.fill(0)
    this.velocities.fill(0)
    this.normalX.fill(0)
    this.normalZ.fill(0)
    this.updateNormals()
    this.syncWaterTexture()
  }

  /**
   * Adds a smooth radial displacement to the surface.
   *
   * @param x World X inside [-1, 1].
   * @param z World Z inside [-1, 1].
   * @param radius Radius of the drop in world units.
   * @param strength Peak height offset, use a negative value for a trough.
   */
  addDrop(x: number, z: number, radius = 0.06, strength = 0.01): void {
    const radiusCells = Math.max(1, (radius / (WATER_POOL_HALF_SIZE * 2)) * (this.resolution - 1))
    const centerX = ((x + WATER_POOL_HALF_SIZE) / (WATER_POOL_HALF_SIZE * 2)) * (this.resolution - 1)
    const centerZ = ((z + WATER_POOL_HALF_SIZE) / (WATER_POOL_HALF_SIZE * 2)) * (this.resolution - 1)

    const minX = Math.max(0, Math.floor(centerX - radiusCells))
    const maxX = Math.min(this.resolution - 1, Math.ceil(centerX + radiusCells))
    const minZ = Math.max(0, Math.floor(centerZ - radiusCells))
    const maxZ = Math.min(this.resolution - 1, Math.ceil(centerZ + radiusCells))

    for (let iz = minZ; iz <= maxZ; iz += 1) {
      for (let ix = minX; ix <= maxX; ix += 1) {
        const dx = ix - centerX
        const dz = iz - centerZ
        const distance = Math.sqrt(dx * dx + dz * dz)
        if (distance > radiusCells) {
          continue
        }
        const falloff = 0.5 - Math.cos((1 - distance / radiusCells) * Math.PI) * 0.5
        this.heights[iz * this.resolution + ix] += falloff * strength
      }
    }
  }

  /**
   * Advances the wave equation.
   *
   * @param substeps Number of simulation steps to run, matching the original
   * demo which runs two steps per rendered frame.
   */
  step(substeps = 2): void {
    const size = this.resolution
    for (let stepIndex = 0; stepIndex < substeps; stepIndex += 1) {
      for (let iz = 0; iz < size; iz += 1) {
        const row = iz * size
        const rowUp = (iz < size - 1 ? iz + 1 : iz) * size
        const rowDown = (iz > 0 ? iz - 1 : iz) * size
        for (let ix = 0; ix < size; ix += 1) {
          const index = row + ix
          const left = ix > 0 ? row + ix - 1 : row + ix
          const right = ix < size - 1 ? row + ix + 1 : row + ix
          const up = rowUp + ix
          const down = rowDown + ix

          const average =
            (this.heights[left] + this.heights[right] + this.heights[up] + this.heights[down]) *
            0.25
          const velocity =
            (this.velocities[index] + (average - this.heights[index]) * this.propagation) *
            this.damping
          this.nextVelocities[index] = velocity
        }
      }

      for (let index = 0; index < this.velocities.length; index += 1) {
        const velocity = this.nextVelocities[index]
        this.velocities[index] = velocity
        this.heights[index] += velocity
      }
    }
  }

  /** Recomputes the surface normal from the current height field. */
  updateNormals(): void {
    const size = this.resolution
    const inverseStep = 1 / (2 * this.spacing)
    for (let iz = 0; iz < size; iz += 1) {
      const row = iz * size
      const rowUp = (iz < size - 1 ? iz + 1 : iz) * size
      const rowDown = (iz > 0 ? iz - 1 : iz) * size
      for (let ix = 0; ix < size; ix += 1) {
        const index = row + ix
        const left = ix > 0 ? index - 1 : index
        const right = ix < size - 1 ? index + 1 : index
        const up = rowUp + ix
        const down = rowDown + ix

        const slopeX = (this.heights[right] - this.heights[left]) * inverseStep
        const slopeZ = (this.heights[up] - this.heights[down]) * inverseStep
        const length = Math.sqrt(slopeX * slopeX + 1 + slopeZ * slopeZ)
        this.normalX[index] = -slopeX / length
        this.normalZ[index] = -slopeZ / length
      }
    }
  }

  /** Copies the current state into the packed half float texture. */
  syncWaterTexture(): void {
    const data = this.waterTextureData
    for (let index = 0; index < this.heights.length; index += 1) {
      const offset = index * 4
      data[offset] = THREE.DataUtils.toHalfFloat(this.heights[index])
      data[offset + 1] = THREE.DataUtils.toHalfFloat(this.velocities[index])
      data[offset + 2] = THREE.DataUtils.toHalfFloat(this.normalX[index])
      data[offset + 3] = THREE.DataUtils.toHalfFloat(this.normalZ[index])
    }
  }

  /** Reads the surface height at a world position, used by tests and tooling. */
  getHeightAt(x: number, z: number): number {
    const ix = Math.round(
      ((x + WATER_POOL_HALF_SIZE) / (WATER_POOL_HALF_SIZE * 2)) * (this.resolution - 1)
    )
    const iz = Math.round(
      ((z + WATER_POOL_HALF_SIZE) / (WATER_POOL_HALF_SIZE * 2)) * (this.resolution - 1)
    )
    const clampedX = Math.min(this.resolution - 1, Math.max(0, ix))
    const clampedZ = Math.min(this.resolution - 1, Math.max(0, iz))
    return this.heights[clampedZ * this.resolution + clampedX]
  }
}
