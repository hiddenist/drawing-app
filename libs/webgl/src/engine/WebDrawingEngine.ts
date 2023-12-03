import { Color, getEventPosition } from "@libs/shared"
import { DrawingEngine, DrawingEngineOptions } from "./DrawingEngine"
import { Vec2 } from "@libs/shared"

interface IWebDrawingEngine {
  canvas: Readonly<HTMLCanvasElement>
  container: Readonly<HTMLDivElement>
  setPixelDensity(pixelDensity: number): this
  resizeCanvas(width: number, height: number): this
}

/*
 * Notes: The WebDrawingEngine class is a wrapper around the DrawingEngine class that adds a canvas element to the DOM.
 * It handles all of the web-specific logic for the DrawingEngine class, which could possibly be adapted to other platforms.
 */
export class WebDrawingEngine extends DrawingEngine implements IWebDrawingEngine {
  public readonly canvas: HTMLCanvasElement
  public readonly container: HTMLDivElement

  constructor(
    /**
     * Note: Pointer events within the root element have their default behavior prevented.
     */
    private readonly root: HTMLElement,
    options: DrawingEngineOptions,
  ) {
    const { width, height } = options
    const { container, canvas, gl } = WebDrawingEngine.createElements(options)
    super(gl, options)

    this.container = container
    this.canvas = canvas

    this.resizeCanvas(width, height)
    root.appendChild(container)

    this.setColor(Color.WHITE)

    this.addEventListeners()
  }

  private static createElements({ width, height, pixelDensity = 1 }: DrawingEngineOptions) {
    const container = document.createElement("div")
    container.classList.add("drawing-canvas-container")
    container.style.position = "relative"

    const canvas = document.createElement("canvas")
    canvas.width = width * pixelDensity
    canvas.height = height * pixelDensity
    container.appendChild(canvas)

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
    })
    if (!gl) {
      throw new Error("Could not get canvas context")
    }

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    return { container, canvas, gl }
  }

  /**
   * @deprecated
   */
  get engine() {
    return this
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
      this.setPressed(true, position, [event.pressure])
      this.canvas.style.setProperty("cursor", "none")
    })
    this.addListener("pointermove", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      let positions = [position]
      let pressure = [event.pressure]
      try {
        positions = event.getCoalescedEvents().map((coalsecedEvent) => this.getCanvasPosition(coalsecedEvent))
        pressure = event.getCoalescedEvents().map((coalsecedEvent) => coalsecedEvent.pressure)
      } catch (error) {
        console.warn("Could not get coalesced events", error)
      }
      this.addPositions(positions, pressure)
    })
    this.addListener("pointerup", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.setPressed(false, position, [event.pressure])
      this.canvas.style.removeProperty("cursor")
    })

    this.addListener("touchmove", () => {
      // noop, this just disables the default behavior of scrolling when touching the canvas
    })
  }

  /**
   * Add multiple events to one listener.
   */
  // private addListeners<K extends keyof HTMLElementEventMap>(
  //   eventNames: Array<K>,
  //   handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
  //   element: HTMLElement = this.root,
  // ) {
  //   for (const eventName of eventNames) {
  //     this.addListener(eventName, handler, element)
  //   }
  // }

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

  private getCanvasPosition(event: Event): Vec2 {
    const [x, y] = getEventPosition(event, this.container)
    return [x * this.pixelDensity, y * this.pixelDensity]
  }
}

interface DrawingEvent<E extends Event> {
  event: E
  position: Vec2
}
