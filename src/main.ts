import "./style.css"

import { DrawingApp } from "./DrawingApp"
import { Color } from "./Color"

main()

function main() {
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element not found")
  }
  const canvas = document.createElement("canvas")
  canvas.width = 500
  canvas.height = 500
  root.appendChild(canvas)
  const webgl = new DrawingApp(canvas)

  webgl.drawLine([0, 0, 1, 1], new Color(255, 0, 0))
  webgl.drawLine([-1, 1, 1, -1], new Color(255, 255, 0))
  webgl.drawLine([0, 0, 1, 0], new Color(0, 255, 0))
  webgl.drawLine([0, 0, 0, 1], new Color(0, 255, 255))
}
