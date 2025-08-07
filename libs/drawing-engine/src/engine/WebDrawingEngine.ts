import { Color, getEventPosition } from "@libs/shared"
import { DrawingEngine, DrawingEngineOptions, EventType } from "./DrawingEngine"
import { ToolNames } from "../tools/Tools"
import { Vec2 } from "@libs/shared"
import { SourceImage } from "../utils/image/SourceImage"
import { InputPoint } from "../tools/InputPoint"

interface IWebDrawingEngine {
  canvas: Readonly<HTMLCanvasElement>
  container: Readonly<HTMLDivElement>
  setPixelDensity(pixelDensity: number): this
  resizeCanvas(width: number, height: number): this
  getDataUri(): string
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

    this.bindBrowserEvents()

    this.addListener(EventType.changeTool, ({ tool }) => {
      this.root.dataset.tool = tool
    })
  }

  private static createElements({ width, height, pixelDensity = 1 }: DrawingEngineOptions) {
    const container = document.createElement("div")
    container.classList.add("drawing-canvas-container")
    container.style.position = "relative"

    const canvas = document.createElement("canvas")
    canvas.width = width * pixelDensity
    canvas.height = height * pixelDensity
    container.appendChild(canvas)

    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    })
    if (!gl) {
      throw new Error("Could not get WebGL 2.0 context. WebGL 2.0 is required.")
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

  public getDataUri() {
    // note: This doesn't always work without the preserveDrawingBuffer option on the canvas context.
    return this.canvas.toDataURL()
  }

  public setPixelDensity(pixelDensity: number) {
    this.pixelDensity = pixelDensity
    this.resizeCanvas(this.canvas.width, this.canvas.height)
    return this
  }

  public resizeCanvas(width: number, height: number) {
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
    super.resizeCanvas(width * this.pixelDensity, height * this.pixelDensity)
    return this
  }

  public loadImage(image: SourceImage, imageName?: string): void {
    // const size = getImageDimensions(image) ?? { width: 0, height: 0 }
    // if (size.width > this.canvas.width || size.height > this.canvas.height) {
    //   if (confirm("The image is larger than the canvas. Do you want to resize the canvas?")) {
    //     this.resizeCanvas(size.width / this.pixelDensity, size.height / this.pixelDensity)
    //   }
    // }
    super.loadImage(image, imageName)
  }

  private bindBrowserEvents() {
    this.listenOnPositionEvent("pointerdown", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.handlePointerDown(position)
      if (this.getCurrentToolName() === ToolNames.brush || this.getCurrentToolName() === ToolNames.softBrush) {
        this.canvas.style.setProperty("cursor", "none")
      }
    })
    this.listenOnPositionEvent("pointermove", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      let positions: InputPoint[] = [[...position, event.pressure]]
      try {
        positions = event
          .getCoalescedEvents()
          .map((coalsecedEvent) => [...this.getCanvasPosition(coalsecedEvent), coalsecedEvent.pressure])
      } catch (error) {
        console.warn("Could not get coalesced events", error)
      }
      this.handlePointerMove(positions)
    })
    this.listenOnPositionEvent("pointerup", ({ position, event }) => {
      if (event.isPrimary === false) {
        return
      }
      this.handlePointerUp(position)
      this.canvas.style.removeProperty("cursor")
    })

    this.listenOnPositionEvent("touchmove", () => {
      // noop, this just disables the default behavior of scrolling when touching the canvas
    })

    window.addEventListener("keydown", (event) => {
      if (event.key === "Control" && !this.state.isPressed) {
        this.setTool(ToolNames.eyedropper)
        return
      }
    })

    window.addEventListener("keyup", (event) => {
      if (event.key === "Escape") {
        this.handleCancel()
      } else if (event.key === "Control" && this.state.tool === ToolNames.eyedropper) {
        this.handleCancel()
      }
    })
  }

  /**
   * Add multiple events to one listener.
   */
  // private addListenersEventType.Kextends keyof HTMLElementEventMap>(
  //   eventNames: Array<K>,
  //   handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
  //   element: HTMLElement = this.root,
  // ) {
  //   for (const eventName of eventNames) {
  //     this.addListener(EventType.ventName handler, element)
  //   }
  // }

  private listenOnPositionEvent<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler?: (event: DrawingEvent<HTMLElementEventMap[K]>) => void,
    element: HTMLElement = this.root,
  ) {
    element.addEventListener(
      eventName,
      (event) => {
        event.preventDefault()
        handler?.bind(this)({
          event,
          position: this.getCanvasPosition(event),
        })
      },
      { passive: false },
    )
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
