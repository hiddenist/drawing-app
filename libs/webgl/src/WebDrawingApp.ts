import { Color, getEventPosition } from "@libs/shared"
import { DrawingEngine } from "./engine/DrawingEngine"
import { Vec2 } from "@libs/shared"

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
    this.engine.setColor(Color.WHITE)

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
    this.addListener("pointerdown", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.engine.setPressed(true, position)
      this.canvas.style.setProperty("cursor", "none")
    })
    this.addListener("pointermove", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.engine.addPosition(position)
    })
    this.addListener("pointerup", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.engine.setPressed(false, position)
      this.canvas.style.removeProperty("cursor")
    })
  }

  /**
   * Add multiple events to one listener.
   */
  protected addListeners<K extends keyof HTMLElementEventMap>(
    eventNames: Array<K>,
    handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
    element: HTMLElement = this.root,
  ) {
    for (const eventName of eventNames) {
      this.addListener(eventName, handler, element)
    }
  }

  protected addListener<K extends keyof HTMLElementEventMap>(
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

  protected getCanvasPosition(event: Event): Vec2 {
    const [x, y] = getEventPosition(event, this.canvas)
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}

interface DrawingEvent<E extends Event> {
  event: E
  position: Vec2
}
