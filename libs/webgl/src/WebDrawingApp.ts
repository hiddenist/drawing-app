import { Color } from "./utils/Color"
import { DrawingEngine } from "./engine/DrawingEngine"
import { VectorArray } from "./types/arrays"

export class WebDrawingApp {
  public readonly canvas: HTMLCanvasElement
  private engine: DrawingEngine

  constructor(
    private readonly root: HTMLElement,
    width: number,
    height: number,
    private pixelDensity = window.devicePixelRatio
  ) {
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
    this.root.addEventListener("pointerdown", (e) => this.handleMouseDown(e))
    this.root.addEventListener("pointermove", (e) => this.handleMouseUp(e))
    this.root.addEventListener("pointerup", (e) => this.handleMouseMove(e))
  }

  private handleMouseDown(event: PointerEvent) {
    this.engine.setPressed(true, this.getMousePosition(event))
  }

  private handleMouseMove(event: PointerEvent) {
    this.engine.setPosition(this.getMousePosition(event))
  }

  private handleMouseUp(event: PointerEvent) {
    this.engine.setPressed(false, this.getMousePosition(event))
  }

  private getMousePosition(event: PointerEvent): VectorArray<2> {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}
