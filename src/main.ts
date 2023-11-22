import "./style.css"

import { DrawingApp } from "./classes/DrawingApp"
import { Color } from "./classes/Color"

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

  webgl.foregroundColor = new Color(255, 0, 0)
  webgl.drawLine([0, 0, 1, 1])
  webgl.drawLine([0.5, -0.5, 0.5, 0.5])
  webgl.foregroundColor = new Color(255, 255, 0)
  webgl.drawLine([-1, 1, 1, -1])
  webgl.foregroundColor = new Color(0, 255, 0)
  webgl.drawLine([0, 0, 1, 0])
  webgl.foregroundColor = new Color(0, 255, 255)
  webgl.drawLine([0, 0, 0, 1])
}
