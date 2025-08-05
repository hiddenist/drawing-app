import { Color, getEventPosition } from "@libs/shared"
import { ValueSaturationGradientColorProgram } from "./ValueSaturationGradientColorProgram"

export class ColorPicker {
  private readonly program: ValueSaturationGradientColorProgram
  private readonly onSetColor: (color: Color) => void
  private readonly onPreviewColor: (color: Color | null) => void
  private currentColor: Color
  private readonly canvas: HTMLCanvasElement
  private markerPosition: [x: number, y: number] | null = null

  constructor(
    private readonly root: HTMLElement,
    public readonly config: {
      initialColor?: Color
      onChange: (color: Color) => void
    },
  ) {
    const { canvas, gl } = this.createCanvas()
    this.canvas = canvas
    this.currentColor = config.initialColor ?? Color.BLACK

    const container = document.createElement("div")
    container.classList.add("color-picker")
    container.appendChild(canvas)
    this.root.appendChild(container)

    const hueSlider = document.createElement("input")
    hueSlider.type = "range"
    hueSlider.min = "0"
    hueSlider.max = "360"
    hueSlider.step = "1"
    hueSlider.value = "0"
    hueSlider.addEventListener("input", () => {
      this.setHue(parseFloat(hueSlider.value))
    })
    const hueSliderContainer = document.createElement("div")
    hueSliderContainer.classList.add("hue-slider")
    hueSliderContainer.appendChild(hueSlider)
    container.prepend(hueSliderContainer)

    const openPickerButton = document.createElement("button")
    openPickerButton.classList.add("current-color-button")
    openPickerButton.innerText = "color picker"
    container.appendChild(openPickerButton)

    const closePickerButton = document.createElement("button")
    closePickerButton.classList.add("close-picker-button")
    closePickerButton.innerText = "close"

    container.prepend(closePickerButton)

    if (config.initialColor) {
      openPickerButton.style.backgroundColor = config.initialColor.hex
    }

    this.onSetColor = (color) => {
      openPickerButton.style.backgroundColor = color.hex
      this.config.onChange(color)
      this.currentColor = color
      this.draw(color)
    }

    this.onPreviewColor = (color) => {
      openPickerButton.style.backgroundColor = (color ?? this.currentColor).hex
    }

    this.program = new ValueSaturationGradientColorProgram(gl)
    this.draw()

    openPickerButton.addEventListener("click", () => {
      document.body.classList.toggle("picker-open")
      if (document.body.classList.contains("picker-open")) {
        this.draw()
      }
    })
    closePickerButton.addEventListener("click", () => {
      document.body.classList.remove("picker-open")
    })
    canvas.addEventListener("pointerup", (e) => {
      const color = this.getCanvasColor(e)
      this.markerPosition = getEventPosition(e)
      this.onSetColor(color)
    })

    let lastMoveEvent: PointerEvent | null = null
    canvas.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )
    canvas.addEventListener("pointermove", (e) => {
      const isClicking = e.buttons === 1
      if (!isClicking) {
        return
      }

      lastMoveEvent = e
      e.preventDefault()
      const color = this.getCanvasColor(e)
      this.setColorPreview(color, getEventPosition(e))
    })
    window.addEventListener("pointerup", (e) => {
      const isMobile = window.matchMedia("(max-width: 800px)").matches
      if (!document.body.classList.contains("picker-open") && isMobile) {
        lastMoveEvent = null
        return
      }
      if (lastMoveEvent && e.target !== canvas) {
        const color = this.getCanvasColor(lastMoveEvent)
        this.markerPosition = getEventPosition(lastMoveEvent)
        lastMoveEvent = null
        this.onSetColor(color)
        return
      }
    })
  }

  private draw(color = this.currentColor, markerPosition = this.markerPosition) {
    this.program.draw(this.getHue(), color, markerPosition ?? undefined)
  }

  public setHue(hue: number) {
    this.program.setHue(hue)
    this.onSetColor(this.currentColor.setHue(hue))
  }

  public getHue(): number {
    return this.program.getHue()
  }

  public getSaturation(): number {
    return this.currentColor.getHslValues()[1]
  }

  public setColor(color: Color) {
    this.markerPosition = this.getPositionFromColor(color)
    this.onSetColor(color)
    this.currentColor = color
  }

  private getPositionFromColor(color: Color): [x: number, y: number] {
    const [_, saturation, value] = color.getHsvValues()
    const x = (saturation / 100) * this.canvas.width
    const y = (1 - value / 100) * this.canvas.height
    return [x, y]
  }

  public setColorPreview(color: Color | null, markerPosition?: [x: number, y: number]) {
    this.onPreviewColor(color)
    const drawColor = color ?? this.currentColor
    this.markerPosition = markerPosition ?? this.getPositionFromColor(drawColor)
    this.draw(drawColor, this.markerPosition)
  }

  public getColor(): Color {
    return this.currentColor
  }

  private createCanvas() {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })
    if (!gl) {
      throw new Error("Could not get canvas context")
    }
    return { canvas, gl }
  }

  private getCanvasColor(event: MouseEvent): Color {
    const [x, y] = getEventPosition(event)

    const saturation = (x / this.canvas.width) * 100
    const value = (1 - y / this.canvas.height) * 100
    const color = Color.createFromHsv(this.getHue(), saturation, value)

    return color
  }
}
