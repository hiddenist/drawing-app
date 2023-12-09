import "./style.css"

import { WebDrawingEngine, Tools } from "@libs/webgl"
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
  const engine = new WebDrawingEngine(canvasRoot, {
    width,
    height,
    pixelDensity: window.devicePixelRatio,
  })

  const tools = [
    { value: Tools.brush, label: "Brush" },
    { value: Tools.pressureSensitiveBrush, label: "Pressure-Sensitive Brush" },
    { value: Tools.eyedropper, label: "Grab Color" },
    // { value: "erase", label: "Eraser" },
  ] as const

  const state = {
    hasDrawn: false,
  }
  makeToolbar(sidebarRoot, {
    state,
    initialColor: engine.getCurrentColor(),
    initialOpacity: (engine.getOpacity() * 100) / 255,
    initialWeight: engine.lineWeight,

    onClear() {
      engine.clearCanvas()
    },
    onSetOpacity(opacity) {
      engine.setOpacity((opacity * 255) / 100)
    },
    onSetLineWeight(weight) {
      engine.setLineWeight(weight)
    },
    onSetColor(color) {
      engine.setColor(color)
    },
    onSetTool(tool) {
      engine.setTool(tool)
    },
    onLoadImage(image) {
      engine.loadImage(image)
    },
    onExport(name) {
      const url = engine.getDataUri()
      const link = document.createElement("a")
      link.download = name
      link.href = url
      link.click()
    },
    tools: tools,
    initialTool: engine.getCurrentTool(),

    addListener: engine.addListener.bind(engine),
  })

  if (import.meta.env.DEV && window.location && window.location.hostname === "localhost") {
    return
  }

  window.addEventListener("beforeunload", (e) => {
    if (!state.hasDrawn) return
    e.preventDefault()
    e.returnValue = ""
  })
}
function makeToolbar<T extends string>(
  root: HTMLElement,
  options: {
    state: { hasDrawn: boolean }
    initialColor?: Color
    initialWeight?: number
    initialOpacity?: number
    initialTool?: T

    tools: ReadonlyArray<{ label: string; value: T }>

    onClear: () => void
    onSetOpacity: (opacity: number) => void
    onSetLineWeight: (weight: number) => void
    onSetColor: (color: Color) => void
    onSetTool: (tool: T) => void
    onExport: (name: string) => void
    onLoadImage: (image: HTMLImageElement) => void

    addListener: WebDrawingEngine["addListener"]
  },
) {
  const localState = {
    title: "My Drawing",
  }
  const toolbar = document.createElement("div")
  toolbar.classList.add("toolbar")
  root.append(toolbar)

  const hasDrawnCallbacks = new Set<(value: boolean) => void>()
  const setHasDrawn = (value: boolean) => {
    options.state.hasDrawn = value
    hasDrawnCallbacks.forEach((cb) => cb(value))
  }

  const picker = new ColorPicker(toolbar, {
    initialColor: options.initialColor,
    onChange(color) {
      options.onSetColor(color)
    },
  })
  const recentColors = recentColorTray({
    onColorSelect(color) {
      picker.setColor(color)
    },
  })

  options.addListener("draw", () => {
    recentColors.setSelectedColor(picker.getColor())
  })
  options.addListener("pickColor", ({ color }) => {
    picker.setColor(color)
  })
  options.addListener("previewColor", ({ color }) => {
    picker.setColorPreview(color)
  })

  toolbar.append(recentColors.tray)

  const inputTray = document.createElement("div")
  inputTray.classList.add("input-tray")
  toolbar.prepend(inputTray)

  const toolSelect = document.createElement("select")

  options.addListener("changeTool", ({ tool }) => {
    toolSelect.value = tool
  })
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
  inputTray.append(toolSelect)

  const importInput = document.createElement("input")
  importInput.type = "file"
  importInput.accept = "image/*"
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0]
    if (!file) return
    const image = new Image()
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (!result) return
      if (typeof result !== "string") {
        alert("oops, can't load an image")
        return
      }
      image.src = result
    }
    image.onload = () => {
      options.onLoadImage(image)
    }
    reader.readAsDataURL(file)
  })

  const exportButton = document.createElement("button")
  exportButton.classList.add("export-button")
  const setExportButtonTitle = () => {
    exportButton.innerText = options.state.hasDrawn ? "Export" : "Import"
  }
  hasDrawnCallbacks.add(setExportButtonTitle)
  setExportButtonTitle()
  exportButton.style.minWidth = "6chr"
  exportButton.addEventListener("click", () => {
    if (!options.state.hasDrawn) {
      importInput.click()
      return
    }
    const title = prompt("What would you like to name the image?", localState.title)
    if (!title) return
    localState.title = title
    const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase()
    options.onExport(`${filename || "drawing"}.png`)
  })
  inputTray.append(exportButton)

  const clearButton = document.createElement("button")
  clearButton.classList.add("clear-button")
  clearButton.innerText = "Clear"
  clearButton.addEventListener("click", (e) => {
    e.preventDefault()
    if (!confirm("Are you sure you want to clear the canvas?")) {
      return
    }
    options.onClear()
    setHasDrawn(false)
  })
  inputTray.append(clearButton)
  options.addListener("draw", () => {
    setHasDrawn(true)
  })

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

  toolbar.append(opacitySlider.element)

  const weightSlider = makeSlider({
    className: "weight-slider",
    label: "Line weight",
    initialValue: options.initialWeight ?? 5,
    min: 1,
    max: 256,
    getDisplayValue: (value) => value.toString(),
    onChange(value) {
      options.onSetLineWeight(value)
    },
  })

  toolbar.append(weightSlider.element)

  return toolbar
}

function recentColorTray({
  onColorSelect,
  maxSavedColors = 50,
  maxDisplayedColors = 30,
}: {
  onColorSelect: (color: Color) => void
  maxSavedColors?: number
  maxDisplayedColors?: number
}) {
  const tray = document.createElement("div")
  const colors: { color: Color; element: HTMLElement; isDisplayed: boolean }[] = []
  tray.classList.add("recent-color-tray")

  const updateSelectedClass = (element?: HTMLElement) => {
    ;[...tray.getElementsByClassName("recent-color")].forEach((e) => {
      e.classList.remove("selected")
    })
    element?.classList.add("selected")
  }
  return {
    tray,
    setSelectedColor: (color: Color) => {
      const existing = colors.find((c) => c.color.equals(color))
      if (existing) {
        updateSelectedClass(existing.element)
        existing.element.classList.add("selected")
        if (!existing.isDisplayed) {
          existing.isDisplayed = true
          tray.prepend(existing.element)
        }
        return existing
      }

      const colorElement = document.createElement("button")
      colorElement.classList.add("recent-color")
      colorElement.style.backgroundColor = color.hex
      colorElement.addEventListener("click", () => {
        onColorSelect(color)
        updateSelectedClass(colorElement)
      })
      tray.prepend(colorElement)
      updateSelectedClass(colorElement)
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
