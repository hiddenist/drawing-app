import "./style.css"

import { WebDrawingEngine } from "@libs/webgl"
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
  const engine = new WebDrawingEngine(canvasRoot, width, height, window.devicePixelRatio)

  new ColorPicker(sidebarRoot, {
    initialColor: engine.getCurrentColor(),
    onChange(color) {
      engine.setColor(color)
    },
  })

  const weightInput = document.createElement("input")
  weightInput.type = "range"
  weightInput.max = "100"
  weightInput.min = "1"
  weightInput.value = engine.lineWeight.toString()
  weightInput.addEventListener("change", () => {
    engine.setLineWeight(parseInt(weightInput.value))
  })

  sidebarRoot.prepend(weightInput)
}
