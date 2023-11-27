import "./style.css"

import { WebDrawingApp } from "@libs/webgl"
import { ColorPicker } from "@libs/color-picker"

main()

function main() {
  const canvasRoot = document.getElementById("canvas-root")
  const sidebarRoot = document.getElementById("sidebar-root")
  if (!canvasRoot || !sidebarRoot) {
    console.error("Some elements were not found", { canvasRoot, sidebarRoot })
    throw new Error("Some elements were not found")
  }
  const width = Math.min(window.innerWidth, 500)
  const height = Math.min(window.innerHeight, 500)
  const app = new WebDrawingApp(canvasRoot, width, height)

  const currentColor = document.createElement("div")
  currentColor.classList.add("current-color")

  new ColorPicker(sidebarRoot, (color) => {
    app.engine.setColor(color)
    currentColor.style.backgroundColor = color.rgba
  })
  sidebarRoot.appendChild(currentColor)
}
