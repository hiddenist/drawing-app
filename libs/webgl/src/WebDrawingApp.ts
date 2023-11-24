import { Color } from "./utils/Color"
import { DrawingEngine } from "./engine/DrawingEngine"
import { VectorArray } from "./types/arrays"

export class WebDrawingApp {
  public readonly canvas: HTMLCanvasElement
  public readonly engine: DrawingEngine

  constructor(
    private readonly root: HTMLElement,
    width: number,
    height: number,
    private pixelDensity = window.devicePixelRatio,
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
    this.addListener("pointerdown", this.handlePress)
    this.addListener("pointermove", this.handleMove)
    this.addListener("pointerup", this.handleRelease)
  }

  private addListener<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler?: (event: HTMLElementEventMap[K]) => void,
    element: HTMLElement = this.root,
  ) {
    element.addEventListener(eventName, (event) => {
      event.preventDefault()
      handler?.bind(this)(event)
    })
  }

  private handlePress(event: PointerEvent) {
    this.engine.setPressed(true, this.getMousePosition(event))
  }

  private handleMove(event: PointerEvent) {
    const position = this.getMousePosition(event)
    this.engine.addPosition(position)
  }

  private handleRelease(event: PointerEvent) {
    this.engine.setPressed(false, this.getMousePosition(event))
  }

  private getMousePosition(event: PointerEvent): VectorArray<2> {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}
