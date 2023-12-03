import { Color, getEventPosition } from "@libs/shared"
import { ValueSaturationGradientColorProgram } from "./ValueSaturationGradientColorProgram"

export class ColorPicker {
  private readonly program: ValueSaturationGradientColorProgram
  private readonly onSetColor: (color: Color) => void
  private readonly onPreviewColor: (color: Color | null) => void
  private currentColor: Color

  constructor(
    private readonly root: HTMLElement,
    public readonly config: {
      initialColor?: Color
      onChange: (color: Color) => void
    },
  ) {
    const { canvas, gl } = this.createCanvas()
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
    }

    this.onPreviewColor = (color) => {
      openPickerButton.style.backgroundColor = (color ?? this.currentColor).hex
    }

    this.program = new ValueSaturationGradientColorProgram(gl)
    this.program.draw()

    openPickerButton.addEventListener("click", () => {
      document.body.classList.toggle("picker-open")
      if (document.body.classList.contains("picker-open")) {
        this.program.draw()
      }
    })
    closePickerButton.addEventListener("click", () => {
      document.body.classList.remove("picker-open")
    })
    canvas.addEventListener("pointerup", (e) => {
      const color = this.getCanvasColor(e)
      this.onSetColor(color)
    })

    let lastMoveEvent: PointerEvent | null = null
    canvas.addEventListener("touchmove", (e) => {
      e.preventDefault()
    })
    canvas.addEventListener("pointermove", (e) => {
      const isClicking = e.buttons === 1
      if (!isClicking) {
        return
      }

      lastMoveEvent = e
      e.preventDefault()
      const color = this.getCanvasColor(e)
      openPickerButton.style.backgroundColor = color.hex
    })
    window.addEventListener("pointerup", (e) => {
      const isMobile = window.matchMedia("(max-width: 800px)").matches
      if (!document.body.classList.contains("picker-open") && isMobile) {
        lastMoveEvent = null
        return
      }
      if (lastMoveEvent && e.target !== canvas) {
        const color = this.getCanvasColor(lastMoveEvent)
        lastMoveEvent = null
        this.onSetColor(color)
        return
      }
    })
  }

  public setHue(hue: number) {
    this.program.draw(hue)
    this.onSetColor(this.currentColor.setHue(hue))
  }

  public getHue(): number {
    return this.program.getHue()
  }

  public getSaturation(): number {
    return this.currentColor.getHslValues()[1]
  }

  public setColor(color: Color) {
    this.onSetColor(color)
    this.currentColor = color
  }

  public setColorPreview(color: Color | null) {
    this.onPreviewColor(color)
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
    return this.program.getColorAtPosition(getEventPosition(event))
  }
}
