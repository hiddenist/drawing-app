import { Color } from "./utils/Color"
import { DrawingEngine } from "./engine/DrawingEngine"
import { VectorArray } from "./types/arrays"

export class WebDrawingApp {
  public readonly canvas: HTMLCanvasElement
  private engine: DrawingEngine

  constructor(root: HTMLElement, width: number, height: number, private pixelDensity = window.devicePixelRatio) {
    this.canvas = document.createElement("canvas")
    root.appendChild(this.canvas)
    this.resizeCanvas(width, height)

    this.engine = new DrawingEngine(this.canvas)
    this.engine.clearCanvas()
    this.engine.color.setForeground(Color.WHITE)

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
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e))
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e))
    window.addEventListener("mousemove", (e) => this.handleMouseMove(e))
  }

  private handleMouseUp(event: MouseEvent) {
    this.engine.setPressed(false, this.getMousePosition(event))
  }

  private handleMouseDown(event: MouseEvent) {
    this.engine.setPressed(true, this.getMousePosition(event))
  }

  private handleMouseMove(event: MouseEvent) {
    this.engine.setPosition(this.getMousePosition(event))
  }

  private getMousePosition(event: MouseEvent): VectorArray<2> {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}
