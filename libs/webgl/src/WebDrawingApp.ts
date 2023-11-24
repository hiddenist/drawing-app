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
    this.addListener("pointerdown", ({ position }) => {
      this.engine.setPressed(true, position)
    })
    this.addListener("pointermove", ({ position }) => {
      this.engine.addPosition(position)
      this.engine.setCursorPosition(position)
    })
    this.addListener("pointerup", ({ position }) => {
      this.engine.setPressed(false, position)
    })
    this.addListeners(["pointerout", "pointerleave"], () => {
      this.engine.setCursorPosition([])
    })
  }

  private addListeners<K extends keyof HTMLElementEventMap>(
    eventNames: Array<K>,
    handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
    element: HTMLElement = this.root,
  ) {
    for (const eventName of eventNames) {
      this.addListener(eventName, handler, element)
    }
  }

  private addListener<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
    element: HTMLElement = this.root,
  ) {
    element.addEventListener(eventName, (event) => {
      event.preventDefault()
      handler?.bind(this)({
        event,
        position: this.getCanvasPosition(event),
      })
    })
  }

  private getCanvasPosition(event: Event): VectorArray<2> {
    if (!(event instanceof MouseEvent)) {
      return [NaN, NaN]
    }

    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}

interface DrawingEvent<E extends Event> {
  event: E
  position: VectorArray<2>
}
