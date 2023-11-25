import { Color, getEventPosition } from "@libs/shared"
import { GradientColorProgram } from "./GradientColorProgram"

export class ColorPicker {
  private readonly program: GradientColorProgram

  constructor(private readonly root: HTMLElement, public readonly onChange: (color: Color) => void) {
    this.onChange = onChange
    const { canvas, gl } = this.createCanvas()
    this.root.appendChild(canvas)

    this.program = new GradientColorProgram(gl)
    this.program.draw()

    canvas.addEventListener("click", (e) => {
      const color = this.getCanvasColor(e)
      this.onChange(color)
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
