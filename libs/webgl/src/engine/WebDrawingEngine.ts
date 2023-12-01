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
    const { container, canvas, context, activeDrawingLayer } = WebDrawingEngine.createElements(options)
    super(context, activeDrawingLayer, options)

    this.container = container
    this.canvas = canvas

    this.resizeCanvas(width, height)
    root.appendChild(container)

    this.clearCanvas()
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

    const context = canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false })
    if (!context) {
      throw new Error("Could not get canvas context")
    }

    const activeDrawingLayer = WebDrawingEngine.cloneCanvasWithNewContext(canvas, {
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      width,
      height,
    })

    return { container, canvas, context, activeDrawingLayer }
  }

  protected static cloneCanvasWithNewContext(
    baseCanvas: HTMLCanvasElement,
    {
      width = baseCanvas.width,
      height = baseCanvas.height,
      ...options
    }: WebGLContextAttributes & { width?: number; height?: number } = {},
  ) {
    if (!(baseCanvas instanceof HTMLCanvasElement)) {
      throw new Error("canvas needs to be an active HTMLCanvasElement")
    }
    const canvas = document.createElement("canvas")
    baseCanvas.parentElement?.appendChild(canvas)
    canvas.width = baseCanvas.width
    canvas.height = baseCanvas.height
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    // todo: add a stylesheet for the engine so we dont have to do these inline
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.pointerEvents = "none"
    const context = canvas.getContext("webgl", options)
    if (!context) {
      throw new Error("Unable to get WebGL context")
    }
    return context
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
      this.setPressed(true, position)
      this.canvas.style.setProperty("cursor", "none")
    })
    this.addListener("pointermove", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.addPosition(position)
    })
    this.addListener("pointerup", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.setPressed(false, position)
      this.canvas.style.removeProperty("cursor")
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
