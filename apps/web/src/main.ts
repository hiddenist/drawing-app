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
  const engine = new WebDrawingEngine(canvasRoot, { width, height, pixelDensity: window.devicePixelRatio })

  new ColorPicker(sidebarRoot, {
    initialColor: engine.getCurrentColor(),
    onChange(color) {
      engine.setColor(color)
    },
  })

  const opacityLabel = document.createElement("label")
  const opacityInput = document.createElement("input")
  const getOpacityPercent = () => ((engine.getOpacity() * 100) / 255).toFixed(0)
  const opacityText = document.createElement("span")
  opacityInput.type = "range"
  opacityInput.max = "255"
  opacityInput.min = "0"
  opacityInput.value = engine.getOpacity().toString()
  opacityInput.addEventListener("change", () => {
    engine.setOpacity(parseInt(opacityInput.value))
    opacityText.innerText = `Opacity: ${getOpacityPercent()}%`
  })
  opacityText.innerText = `Opacity: ${getOpacityPercent()}%`
  opacityLabel.append(opacityText)
  opacityLabel.append(opacityInput)

  sidebarRoot.prepend(opacityLabel)

  const weightLabel = document.createElement("label")
  const weightInput = document.createElement("input")
  const weightText = document.createElement("span")
  weightInput.type = "range"
  weightInput.max = "100"
  weightInput.min = "1"
  weightInput.value = engine.lineWeight.toString()
  weightInput.addEventListener("change", () => {
    const weight = parseInt(weightInput.value)
    engine.setLineWeight(weight)
    weightText.innerText = `Line weight: ${weightInput.value}`
  })
  weightText.innerText = `Line weight: ${weightInput.value}`
  weightLabel.append(weightText)
  weightLabel.append(weightInput)

  sidebarRoot.prepend(weightLabel)
}
