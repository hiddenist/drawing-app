import "./style.css"

import { WebDrawingEngine } from "@libs/webgl"
import { ColorPicker } from "@libs/color-picker"
import { Color } from "@libs/shared"

import { makeSlider } from "./elements/makeSlider"

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

  const tools = [
    { value: "draw", label: "Brush" },
    // { value: "erase", label: "Eraser" },
  ] as const

  makeToolbar(sidebarRoot, {
    initialColor: engine.getCurrentColor(),
    initialOpacity: (engine.getOpacity() * 100) / 255,
    initialWeight: engine.lineWeight,

    onClear() {
      engine.clearCanvas()
    },
    onSetOpacity(opacity) {
      engine.setOpacity(opacity)
    },
    onSetLineWeight(weight) {
      engine.setLineWeight(weight)
    },
    onSetColor(color) {
      engine.setColor(color)
    },
    onSetTool(tool) {
      console.log(tool)
    },
    tools: tools,
    initialTool: tools[0].value,
  })

  if (import.meta.env.DEV && window.location && window.location.hostname === "localhost") {
    return
  }

  window.addEventListener("beforeunload", (e) => {
    e.preventDefault()
    e.returnValue = ""
  })
}
function makeToolbar<T extends string>(
  root: HTMLElement,
  options: {
    initialColor?: Color
    initialWeight?: number
    initialOpacity?: number
    tools: ReadonlyArray<{ label: string; value: T }>
    initialTool?: T

    onClear: () => void
    onSetOpacity: (opacity: number) => void
    onSetLineWeight: (weight: number) => void
    onSetColor: (color: Color) => void
    onSetTool: (tool: T) => void
  },
) {
  const toolbar = document.createElement("div")
  toolbar.classList.add("toolbar")
  root.append(toolbar)

  const picker = new ColorPicker(toolbar, {
    initialColor: options.initialColor,
    onChange(color) {
      recentColors.setSelectedColor(color)
      options.onSetColor(color)
    },
  })
  const recentColors = recentColorTray({
    onColorSelect(color) {
      picker.setColor(color)
    },
  })

  toolbar.append(recentColors.tray)

  const inputTray = document.createElement("div")
  inputTray.classList.add("input-tray")
  toolbar.prepend(inputTray)

  const clearButton = document.createElement("button")
  clearButton.classList.add("clear-button")
  clearButton.innerText = "Clear"
  clearButton.addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear the canvas?")) {
      return
    }
    options.onClear()
  })
  inputTray.prepend(clearButton)

  const toolSelect = document.createElement("select")
  toolSelect.classList.add("tool-select")
  const labelOption = document.createElement("option")
  labelOption.value = ""
  labelOption.innerText = "Select Tool"
  labelOption.disabled = true
  if (!options.initialTool) {
    labelOption.selected = true
  }
  toolSelect.append(labelOption)
  options.tools.forEach((tool) => {
    const option = document.createElement("option")
    option.value = tool.value
    option.innerText = tool.label
    if (tool.value === options.initialTool) {
      option.selected = true
    }
    toolSelect.append(option)
  })
  toolSelect.addEventListener("change", () => {
    options.onSetTool(toolSelect.value as T)
  })
  inputTray.prepend(toolSelect)

  const opacitySlider = makeSlider({
    className: "opacity-slider",
    label: "Opacity",
    initialValue: options.initialOpacity ?? 100,
    labelAppend: "%",
    min: 0,
    max: 100,
    getDisplayValue: (value) => value.toFixed(0),
    onChange(value) {
      options.onSetOpacity(value)
    },
  })

  toolbar.prepend(opacitySlider.element)

  const weightSlider = makeSlider({
    className: "weight-slider",
    label: "Line weight",
    initialValue: options.initialWeight ?? 5,
    min: 1,
    max: 255,
    getDisplayValue: (value) => value.toString(),
    onChange(value) {
      options.onSetLineWeight(value)
    },
  })

  toolbar.prepend(weightSlider.element)

  return toolbar
}

function recentColorTray({
  onColorSelect,
  maxSavedColors = 50,
  maxDisplayedColors = 27,
}: {
  onColorSelect: (color: Color) => void
  maxSavedColors?: number
  maxDisplayedColors?: number
}) {
  const tray = document.createElement("div")
  const colors: { color: Color; element: HTMLElement; isDisplayed: boolean }[] = []
  tray.classList.add("recent-color-tray")
  return {
    tray,
    setSelectedColor: (color: Color) => {
      ;[...tray.getElementsByClassName("recent-color")].forEach((element) => {
        element.classList.remove("selected")
      })
      const existing = colors.find((c) => c.color.equals(color))
      if (existing) {
        existing.element.classList.add("selected")
        if (!existing.isDisplayed) {
          existing.isDisplayed = true
          tray.prepend(existing.element)
        }
        return existing
      }

      const colorElement = document.createElement("button")
      colorElement.classList.add("recent-color")
      colorElement.classList.add("selected")
      colorElement.style.backgroundColor = color.hex
      colorElement.addEventListener("click", () => {
        onColorSelect(color)
      })
      tray.prepend(colorElement)
      const newEntry = { color, element: colorElement, isDisplayed: true }
      colors.push(newEntry)

      if (tray.children.length > maxDisplayedColors && tray.lastChild) {
        tray.removeChild(tray.lastChild)
        const removedColor = colors.find((c) => c.color.equals(color))
        if (removedColor) {
          removedColor.isDisplayed = false
        }
      }

      if (colors.length > maxSavedColors) {
        colors.splice(0, colors.length - maxSavedColors)
      }
      return newEntry
    },
  }
}
