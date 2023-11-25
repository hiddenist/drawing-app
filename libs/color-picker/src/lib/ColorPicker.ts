import { Color } from "@libs/shared"

export class ColorPicker {
  constructor(private readonly root: HTMLElement, public readonly onChange: (color: Color) => void) {
    this.onChange = onChange
    const canvas = document.createElement("canvas")
    canvas.width = 200
    canvas.height = 200
    this.root.appendChild(canvas)
  }
}
