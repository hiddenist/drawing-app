import "./style.css"

import { WebDrawingEngine, EventType, ToolNames, ToolName } from "@libs/drawing-engine"
import { ColorPicker } from "@libs/color-picker"
import { Color } from "@libs/shared"

import { SliderInput } from "./components/SliderInput"
import { HistoryPanel } from "./components/HistoryPanel"
import { ActionMenu } from "./components/ActionMenu"

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
    { value: ToolNames.brush, label: "Brush" },
    { value: ToolNames.softBrush, label: "Soft Brush" },
    { value: ToolNames.eyedropper, label: "Grab Color" },
    { value: ToolNames.eraser, label: "Eraser" },
    { value: ToolNames.softEraser, label: "Soft Eraser" },
  ] as const

  const state = {
    hasDrawn: false,
  }
  makeToolbar(sidebarRoot, {
    state,
    engine,
    initialColor: engine.getCurrentColor(),
    initialOpacity: (engine.getOpacity() * 100) / 255,

    getLineWeight: () => {
      if ("setLineWeight" in engine.activeTool) return engine.activeTool.getLineWeight()
      else return null
    },

    onClear() {
      // Check if last action was already a clear (canvas already cleared)
      const actions = engine.getHistoryActions()
      const lastAction = actions.length > 0 ? actions[actions.length - 1].action : null

      if (lastAction && lastAction.tool === "clear") {
        if (confirm("Canvas is already clear. Do you want to permanently clear all history?")) {
          engine.clearHistory()
        }
        return
      }
      engine.clearCanvas()
    },
    onSetOpacity(opacity) {
      engine.setOpacity((opacity * 255) / 100)
    },
    onSetLineWeight(weight) {
      const tool = "setLineWeight" in engine.activeTool ? engine.activeTool : engine.tools.brush
      tool.setLineWeight(weight)
    },
    onSetColor(color) {
      engine.setColor(color)
    },
    onSetTool(tool) {
      engine.setTool(tool)
    },
    onLoadImage(image, imageName) {
      engine.loadImage(image, imageName)
    },
    onExport(name) {
      const url = engine.getDataUri()
      const link = document.createElement("a")
      link.download = name
      link.href = url
      link.click()
    },
    onUndo() {
      engine.undo()
    },
    onRedo() {
      engine.redo()
    },
    tools: tools,
    initialTool: engine.getCurrentToolName(),

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
function makeToolbar(
  root: HTMLElement,
  options: {
    state: { hasDrawn: boolean }
    engine: WebDrawingEngine
    initialColor?: Color
    initialOpacity?: number
    initialTool?: ToolName
    getLineWeight: () => number | null

    tools: ReadonlyArray<{ label: string; value: ToolName }>

    onClear: () => void
    onSetOpacity: (opacity: number) => void
    onSetLineWeight: (weight: number) => void
    onSetColor: (color: Color) => void
    onSetTool: (tool: ToolName) => void
    onExport: (name: string) => void
    onLoadImage: (image: HTMLImageElement, imageName?: string) => void

    onUndo: () => void
    onRedo: () => void

    addListener: WebDrawingEngine["addListener"]
  },
) {
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
      options.onSetTool(ToolNames.brush)
    },
  })

  options.addListener(EventType.draw, () => {
    recentColors.setSelectedColor(picker.getColor())
  })
  options.addListener(EventType.pickColor, ({ color }) => {
    picker.setColor(color)
  })
  options.addListener(EventType.previewColor, ({ color }) => {
    picker.setColorPreview(color)
  })

  toolbar.append(recentColors.tray)

  const inputTray = document.createElement("div")
  inputTray.classList.add("input-tray")
  toolbar.prepend(inputTray)

  const toolSelect = document.createElement("select")

  options.addListener(EventType.changeTool, ({ tool }) => {
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

  let setWeightRef: { setValue?: (weight: number | string) => void } = {}
  toolSelect.addEventListener("change", () => {
    options.onSetTool(toolSelect.value as ToolName)
    const weight = options.getLineWeight()
    if (weight) {
      setWeightRef.setValue?.(weight)
    }
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
      options.onLoadImage(image, file.name)
    }
    reader.readAsDataURL(file)
  })

  const undoButton = document.createElement("button")
  const redoButton = document.createElement("button")
  undoButton.classList.add("undo-button", "icon-button")
  redoButton.classList.add("redo-button", "icon-button")
  undoButton.innerHTML = "↶"
  redoButton.innerHTML = "↷"
  undoButton.disabled = true
  redoButton.disabled = true
  undoButton.title = "Undo"
  redoButton.title = "Redo"

  inputTray.append(undoButton)
  inputTray.append(redoButton)
  undoButton.addEventListener("click", (e) => {
    e.preventDefault()
    options.onUndo()
  })
  redoButton.addEventListener("click", (e) => {
    e.preventDefault()
    options.onRedo()
  })
  options.addListener(EventType.draw, () => {
    undoButton.disabled = false
    redoButton.disabled = true
  })
  options.addListener(EventType.undo, ({ canUndo }) => {
    undoButton.disabled = !canUndo
    redoButton.disabled = false
  })
  options.addListener(EventType.redo, ({ canRedo }) => {
    undoButton.disabled = false
    redoButton.disabled = !canRedo
  })
  options.addListener(EventType.historyReady, ({ hasHistory, canUndo, canRedo }) => {
    console.log("History ready - hasHistory:", hasHistory, "canUndo:", canUndo, "canRedo:", canRedo)

    // Set button states based on history
    undoButton.disabled = !canUndo
    redoButton.disabled = !canRedo

    if (hasHistory) {
      setHasDrawn(true)
    }
  })

  const clearButton = document.createElement("button")
  clearButton.classList.add("clear-button", "icon-button")
  clearButton.innerHTML = "🗑"
  clearButton.title = "Clear Canvas"
  clearButton.addEventListener("click", (e) => {
    e.preventDefault()
    // Check if last action was already a clear (canvas already cleared)
    const actions = options.engine.getHistoryActions()
    const lastAction = actions.length > 0 ? actions[actions.length - 1].action : null

    if (lastAction && lastAction.tool === "clear") {
      if (confirm("Canvas is already clear. Do you want to permanently clear all history?")) {
        options.engine.clearHistory()
        setHasDrawn(false)
      }
      return
    }
    options.onClear()
    setHasDrawn(false)
  })
  inputTray.append(clearButton)
  options.addListener(EventType.draw, () => {
    setHasDrawn(true)
  })

  const menuButton = document.createElement("button")
  menuButton.classList.add("menu-button", "icon-button")
  menuButton.innerHTML = "☰"
  menuButton.title = "Menu"
  menuButton.addEventListener("click", (e) => {
    e.preventDefault()
    openActionMenu()
  })
  inputTray.append(menuButton)

  function openActionMenu() {
    // Create overlay
    const overlay = document.createElement("div")
    overlay.classList.add("action-menu-overlay")

    // Get current undo/redo state
    const canUndo = options.engine.canUndo()
    const canRedo = options.engine.canRedo()

    // Create action menu
    const menu = ActionMenu({
      onClose: () => {
        closeActionMenu()
      },
      onUndo: options.onUndo,
      onRedo: options.onRedo,
      onClear: () => {
        // Check if last action was already a clear (canvas already cleared)
        const actions = options.engine.getHistoryActions()
        const lastAction = actions.length > 0 ? actions[actions.length - 1].action : null

        if (lastAction && lastAction.tool === "clear") {
          if (confirm("Canvas is already clear. Do you want to permanently clear all history?")) {
            options.engine.clearHistory()
            setHasDrawn(false)
          }
          return
        }
        options.onClear()
        setHasDrawn(false)
      },
      onHistory: openHistoryPanel,
      onExport: options.onExport,
      onImport: () => {
        importInput.click()
      },
      canUndo,
      canRedo,
    })

    function closeActionMenu() {
      menu.cleanup()
      overlay.remove()
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeActionMenu()
      }
    })

    // Put menu inside overlay
    overlay.appendChild(menu)
    document.body.appendChild(overlay)
  }

  function openHistoryPanel() {
    // Create overlay
    const overlay = document.createElement("div")
    overlay.classList.add("history-overlay")

    // Create history panel
    const panel = HistoryPanel({
      engine: options.engine,
      onClose: () => {
        closePanel()
      },
    })

    function closePanel() {
      panel.cleanup()
      overlay.remove()
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closePanel()
      }
    })

    // Put panel inside overlay
    overlay.appendChild(panel)
    document.body.appendChild(overlay)
  }

  const opacitySlider = SliderInput({
    className: "opacity-slider",
    label: "Opacity",
    initialValue: options.initialOpacity ?? 100,
    labelAppend: "%",
    min: 0,
    max: 100,
    controlRef: setWeightRef,
    getDisplayValue: (value) => value.toFixed(0),
    onChange(value) {
      options.onSetOpacity(value)
    },
  })

  toolbar.append(opacitySlider)

  const weightSlider = SliderInput({
    className: "weight-slider",
    label: "Line weight",
    initialValue:
      options.getLineWeight() ??
      (() => {
        const weight = 5
        options.onSetLineWeight(weight)
        return weight
      })(),
    min: 1,
    max: 256,
    controlRef: setWeightRef,
    getDisplayValue: (value) => value.toString(),
    onChange(value) {
      options.onSetLineWeight(value)
    },
  })

  toolbar.append(weightSlider)

  // Soft brush specific controls
  const flowSlider = SliderInput({
    className: "flow-slider",
    label: "Flow",
    initialValue: 15, // 15%
    labelAppend: "%",
    min: 1,
    max: 100,
    controlRef: {},
    getDisplayValue: (value) => value.toFixed(0),
    onChange(value) {
      if ("setFlow" in options.engine.activeTool) {
        options.engine.activeTool.setFlow(value / 100)
      }
    },
  })
  flowSlider.style.display = "none" // Hidden by default

  const hardnessSlider = SliderInput({
    className: "hardness-slider",
    label: "Hardness",
    initialValue: 0, // 0%
    labelAppend: "%",
    min: 0,
    max: 100,
    controlRef: {},
    getDisplayValue: (value) => value.toFixed(0),
    onChange(value) {
      if ("setHardness" in options.engine.activeTool) {
        options.engine.activeTool.setHardness(value / 100)
      }
    },
  })
  hardnessSlider.style.display = "none" // Hidden by default

  toolbar.append(flowSlider)
  toolbar.append(hardnessSlider)

  // Show/hide soft brush controls based on tool selection
  options.addListener(EventType.changeTool, ({ tool }) => {
    if (tool === ToolNames.softBrush || tool === ToolNames.softEraser) {
      flowSlider.style.display = ""
      hardnessSlider.style.display = ""
      // Update slider values from tool
      if ("getFlow" in options.engine.activeTool && "getHardness" in options.engine.activeTool) {
        const flowValue = options.engine.activeTool.getFlow() * 100
        const hardnessValue = options.engine.activeTool.getHardness() * 100
        const flowInput = flowSlider.querySelector("input") as HTMLInputElement
        const flowDisplay = flowSlider.querySelector(".value") as HTMLElement
        const hardnessInput = hardnessSlider.querySelector("input") as HTMLInputElement
        const hardnessDisplay = hardnessSlider.querySelector(".value") as HTMLElement

        if (flowInput && flowDisplay) {
          flowInput.value = flowValue.toString()
          flowDisplay.textContent = flowValue.toFixed(0) + "%"
        }
        if (hardnessInput && hardnessDisplay) {
          hardnessInput.value = hardnessValue.toString()
          hardnessDisplay.textContent = hardnessValue.toFixed(0) + "%"
        }
      }
    } else {
      flowSlider.style.display = "none"
      hardnessSlider.style.display = "none"
    }
  })

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
