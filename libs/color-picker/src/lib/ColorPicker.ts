import { Color, getEventPosition } from "@libs/shared"
import { GradientColorProgram } from "./GradientColorProgram"

export class ColorPicker {
  private readonly program: GradientColorProgram

  constructor(
    private readonly root: HTMLElement,
    public readonly config: {
      initialColor?: Color
      onChange: (color: Color) => void
    },
  ) {
    const { canvas, gl } = this.createCanvas()
    this.root.appendChild(canvas)
    const openPickerButton = document.createElement("button")
    openPickerButton.classList.add("open-picker-button")
    openPickerButton.innerText = "color picker"
    this.root.appendChild(openPickerButton)

    if (config.initialColor) {
      openPickerButton.style.backgroundColor = config.initialColor.rgba
    }

    const onSetColor = (color: Color) => {
      openPickerButton.style.backgroundColor = color.rgba
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
    canvas.addEventListener("mouseup", (e) => {
      const color = this.getCanvasColor(e)
      onSetColor(color)
      document.body.classList.remove("picker-open")
    })

    canvas.addEventListener("mousemove", (e) => {
      const isClicking = e.buttons === 1
      if (!isClicking) {
        return
      }
      e.preventDefault()
      const color = this.getCanvasColor(e)
      onSetColor(color)
    })
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
