import { Color, getEventPosition } from "@libs/shared"
import { GradientColorProgram } from "./GradientColorProgram"

export class ColorPicker {
  private readonly program: GradientColorProgram
  private readonly onSetColor: (color: Color) => void

  constructor(
    private readonly root: HTMLElement,
    public readonly config: {
      initialColor?: Color
      onChange: (color: Color) => void
    },
  ) {
    const { canvas, gl } = this.createCanvas()

    const container = document.createElement("div")
    container.classList.add("color-picker")
    container.appendChild(canvas)
    this.root.appendChild(container)

    const openPickerButton = document.createElement("button")
    openPickerButton.classList.add("open-picker-button")
    openPickerButton.innerText = "color picker"
    container.appendChild(openPickerButton)

    if (config.initialColor) {
      openPickerButton.style.backgroundColor = config.initialColor.hex
    }

    this.onSetColor = (color: Color) => {
      openPickerButton.style.backgroundColor = color.hex
      this.config.onChange(color)
    }

    this.program = new GradientColorProgram(gl)
    this.program.draw()

    openPickerButton.addEventListener("click", () => {
      document.body.classList.toggle("picker-open")
      if (document.body.classList.contains("picker-open")) {
        this.program.draw()
      }
    })
    canvas.addEventListener("pointerup", (e) => {
      const color = this.getCanvasColor(e)
      this.onSetColor(color)
      document.body.classList.remove("picker-open")
    })

    let lastMoveEvent: PointerEvent | null = null
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

  public setColor(color: Color) {
    this.onSetColor(color)
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
