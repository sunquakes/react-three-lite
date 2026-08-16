import { createRoot, type Root } from 'react-dom/client'
import type { ReactNode } from 'react'
import { generateUUID } from './UUID'
import { CSS2DObject } from 'three-stdlib'

export default class Popup {
  public scene: CSS2DObject | undefined
  private id: string
  private start: number | undefined
  private duration: number
  private deltaX: number
  private deltaY: number
  private deltaZ: number
  private state: boolean
  private position: Position
  private root: Root | undefined
  private animationId: number | null = null

  constructor(position: Position, component: ReactNode) {
    this.id = 'popup-' + generateUUID()
    this.duration = 0
    this.deltaX = 0.0
    this.deltaY = 0.0
    this.deltaZ = 0.0
    this.state = false
    this.position = position
    this.create(position, component)
    this.update = this.update.bind(this)
  }

  create(position: Position, component: ReactNode): void {
    if (this.root) {
      return
    }
    let containerElement = document.getElementById(this.id)
    if (containerElement == undefined) {
      containerElement = document.createElement('div')
      containerElement.setAttribute('id', this.id)
      document.body.append(containerElement)
    }
    this.scene = new CSS2DObject(containerElement)
    this.scene.position.set(...position)
    this.root = createRoot(containerElement)
    this.root.render(component)
  }

  moveTo(position: Position, duration: number) {
    this.duration += duration
    this.deltaX += position[0] - this.position[0]
    this.deltaY += position[1] - this.position[1]
    this.deltaZ += position[2] - this.position[2]
    this.position = position
    if (this.state === false) {
      this.state = true
      this.animationId = requestAnimationFrame(this.update)
    }
  }

  update(timestamp: number) {
    if (this.start === undefined) {
      this.start = timestamp
    }
    const deltaTime = timestamp - this.start

    this.start = timestamp

    const timeRatio = Math.min(deltaTime / this.duration, 1)
    const deltaX = this.lerp(0, this.deltaX, timeRatio)
    const deltaY = this.lerp(0, this.deltaY, timeRatio)
    const deltaZ = this.lerp(0, this.deltaZ, timeRatio)
    this.duration -= deltaTime
    this.deltaX -= deltaX
    this.deltaY -= deltaY
    this.deltaZ -= deltaZ

    if (this.scene != undefined) {
      this.scene.position.x += deltaX
      this.scene.position.y += deltaY
      this.scene.position.z += deltaZ
    }

    if (this.duration > 0) {
      this.animationId = requestAnimationFrame(this.update)
    } else {
      this.state = false
    }
  }

  lerp(start: number, end: number, time: number) {
    return start + (end - start) * time
  }

  /**
   * Dispose popup and release resources.
   */
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.state = false
    if (this.root) {
      this.root.unmount()
      this.root = undefined
    }
    const containerElement = document.getElementById(this.id)
    if (containerElement && containerElement.parentNode) {
      containerElement.parentNode.removeChild(containerElement)
    }
  }
}
