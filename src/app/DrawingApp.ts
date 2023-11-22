import { Color } from "../util/Color"
import { DrawingEngine } from "./DrawingEngine"

export class DrawingApp {
  public readonly canvas: HTMLCanvasElement
  private engine: DrawingEngine

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
    window.addEventListener("mousemove", (e) => this.handleMouseMove(e))
    this.canvas.addEventListener("click", (e) => this.handleClick(e))
  }

  private handleClick(event: MouseEvent) {
    const { x, y } = this.getMousePosition(event)

    this.engine.color.setForeground(new Color(255, 0, 0))
    this.engine.drawLine(getPointsToDrawRectangle(x, y, 20))
    this.engine.color.setForeground(new Color(255, 255, 0))
    this.engine.drawLine(getPointsToDrawRectangle(x, y, 30))
    this.engine.color.setForeground(new Color(0, 255, 0))
    this.engine.drawLine(getPointsToDrawRectangle(x, y, 40))
  }

  private handleMouseMove(event: MouseEvent) {
    const { x, y } = this.getMousePosition(event)

    this.engine.color.setForeground(Color.WHITE)
    this.engine.drawLine(getPointsToDrawRectangle(x, y, 10))
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
