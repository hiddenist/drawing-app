import { Color, getEventPosition } from "@libs/shared"
import { GradientColorProgram } from "./GradientColorProgram"

export class ColorPicker {
  private readonly program: GradientColorProgram

  constructor(private readonly root: HTMLElement, public readonly onChange: (color: Color) => void) {
    this.onChange = onChange
    const { canvas, gl } = this.createCanvas()
    this.root.appendChild(canvas)
    const openPickerButton = document.createElement("button")
    openPickerButton.classList.add("open-picker-button")
    openPickerButton.innerText = "color picker"
    this.root.appendChild(openPickerButton)

    this.program = new GradientColorProgram(gl)
    this.program.draw()

    openPickerButton.addEventListener("click", () => {
      document.body.classList.toggle("picker-open")
    })
    canvas.addEventListener("click", (e) => {
      const color = this.getCanvasColor(e)
      this.onChange(color)
      document.body.classList.remove("picker-open")
    })
  }

  private createCanvas(width = 255, height = 255) {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const gl = canvas.getContext("webgl")
    if (!gl) {
      throw new Error("Could not get canvas context")
    }
    return { canvas, gl }
  }

  private getCanvasColor(event: MouseEvent): Color {
    return this.program.getColorAtPosition(getEventPosition(event))
  }
}
