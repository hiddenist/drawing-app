import "./style.css"

import { LineDrawingApp } from "./app/LineDrawingApp"
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
  const app = new LineDrawingApp(canvas)

  app.color.foreground = new Color(255, 0, 0)
  app.drawLine([0, 0, 500, 500])

  // app.drawLine([0.5, -0.5, 0.5, 0.5])
  // app.color.foreground = new Color(255, 255, 0)
  // app.drawLine([-1, 1, 1, -1])
  // app.color.foreground = new Color(0, 255, 0)
  // app.drawLine([0, 0, 1, 0])
  // app.color.foreground = new Color(0, 255, 255)
  // app.drawLine([0, 0, 0, 1])

  // canvas.addEventListener("click", () => {
  //   app.clearCanvas()
  // })
}
