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

  new ColorPicker(sidebarRoot, {
    initialColor: app.engine.getCurrentColor(),
    onChange(color) {
      app.engine.setColor(color)
    },
  })
}
