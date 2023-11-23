import { Color } from "../util/Color"
import { DrawingEngine } from "./DrawingEngine"

export class DrawingApp {
  public readonly canvas: HTMLCanvasElement
  private engine: DrawingEngine
  private isDrawing: boolean = false
  private currentSegment: number[] = []

  constructor(root: HTMLElement, width: number, height: number, private pixelDensity = window.devicePixelRatio) {
    this.canvas = document.createElement("canvas")
    root.appendChild(this.canvas)
    this.resizeCanvas(width, height)

    this.engine = new DrawingEngine(this.canvas)
    this.engine.clearCanvas()

    this.addEventListeners()
  }

  public setPixelDensity(pixelDensity: number) {
    this.pixelDensity = pixelDensity
    this.resizeCanvas(this.canvas.width, this.canvas.height)
    return this
  }

  public resizeCanvas(width: number, height: number) {
    this.canvas.width = width * this.pixelDensity
    this.canvas.height = height * this.pixelDensity
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    return this
  }

  private addEventListeners() {
    this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e))
    this.canvas.addEventListener("mouseup", () => this.stopDrawing())
    this.canvas.addEventListener("mouseout", () => this.stopDrawing())
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e))
  }

  private startDrawing(event: MouseEvent) {
    this.isDrawing = true
    this.addPoint(event.clientX, event.clientY)
  }

  private stopDrawing() {
    this.isDrawing = false
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isDrawing) {
      const cursorPoint = this.getMousePosition(event)
      this.drawCursor(cursorPoint.x, cursorPoint.y)
      return
    }

    const currentPoint = this.getMousePosition(event)
    this.currentSegment.push(currentPoint.x, currentPoint.y)
    this.engine.updateDrawing(this.currentSegment)
  }

  private drawCursor(x: number, y: number) {
    this.engine.color.setForeground(Color.WHITE)
    this.engine.drawLine(getPointsToDrawRectangle(x, y, 10))
  }

  private addPoint(x: number, y: number) {
    const rect = this.canvas.getBoundingClientRect()
    const canvasX = x - rect.left
    const canvasY = y - rect.top
    this.currentSegment.push(canvasX, canvasY)
  }

  private getMousePosition(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return { x: x * this.pixelDensity, y: y * this.pixelDensity }
  }
}

function getPointsToDrawRectangle(x: number, y: number, width: number, height = width) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  return [
    x - halfWidth,
    y - halfHeight,
    x + halfWidth,
    y - halfHeight,

    x + halfWidth,
    y - halfHeight,
    x + halfWidth,
    y + halfHeight,

    x + halfWidth,
    y + halfHeight,
    x - halfWidth,
    y + halfHeight,

    x - halfWidth,
    y + halfHeight,
    x - halfWidth,
    y - halfHeight,
  ].map((n) => Math.floor(n))
}
