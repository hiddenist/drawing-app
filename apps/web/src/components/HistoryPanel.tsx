import { WebDrawingEngine, EventType, HistoryAction } from "@libs/drawing-engine"
import "./HistoryPanel.css"

interface HistoryPanelProps {
  engine: WebDrawingEngine
  onClose: () => void
}

interface HistoryPanelElement extends HTMLDivElement {
  cleanup: () => void
}

export function HistoryPanel({ engine, onClose }: HistoryPanelProps): HistoryPanelElement {
  const container = document.createElement("div") as HistoryPanelElement
  container.className = "history-panel"

  // Prevent clicks on the panel from bubbling to the overlay
  container.addEventListener("click", (e) => {
    e.stopPropagation()
  })

  const header = document.createElement("div")
  header.className = "history-header"

  const title = document.createElement("h3")
  title.textContent = "History"
  header.appendChild(title)

  const closeButton = document.createElement("button")
  closeButton.className = "close-button"
  closeButton.textContent = "×"
  closeButton.onclick = onClose
  header.appendChild(closeButton)

  container.appendChild(header)

  const actions = document.createElement("div")
  actions.className = "history-actions"

  const clearAllButton = document.createElement("button")
  clearAllButton.className = "clear-all-button"
  clearAllButton.textContent = "Clear All History"
  clearAllButton.onclick = clearAllHistory
  actions.appendChild(clearAllButton)

  container.appendChild(actions)

  const listElement = document.createElement("div")
  listElement.className = "history-list"
  container.appendChild(listElement)

  function updateHistoryList() {
    const actions = engine.getHistoryActions()
    listElement.innerHTML = ""

    if (actions.length === 0) {
      const emptyDiv = document.createElement("div")
      emptyDiv.className = "history-empty"
      emptyDiv.textContent = "No history yet"
      listElement.appendChild(emptyDiv)
      return
    }

    actions.forEach((action: HistoryAction, index: number) => {
      const item = document.createElement("div")
      item.className = "history-item"

      const indexSpan = document.createElement("span")
      indexSpan.className = "history-index"
      indexSpan.textContent = `#${index + 1}`
      item.appendChild(indexSpan)

      const toolSpan = document.createElement("span")
      toolSpan.className = "history-tool"
      toolSpan.textContent = getActionDescription(action)
      item.appendChild(toolSpan)

      listElement.appendChild(item)
    })
  }

  function getActionDescription(action: HistoryAction): string {
    if (action.action.tool === "clear") {
      return "Clear canvas"
    } else if (action.action.tool === "import") {
      const importAction = action.action as { tool: "import"; imageName?: string }
      return `Import image${importAction.imageName ? `: ${importAction.imageName}` : ""}`
    } else if (action.action.tool === "brush") {
      const brushAction = action.action as { tool: "brush"; path: any[] }
      return `Brush stroke (${brushAction.path.length} points)`
    } else if (action.action.tool === "eraser") {
      const eraserAction = action.action as { tool: "eraser"; path: any[] }
      return `Eraser stroke (${eraserAction.path.length} points)`
    } else if (action.action.tool === "softBrush") {
      const softBrushAction = action.action as { tool: "softBrush"; strokePoints: any[] }
      return `Soft brush stroke (${softBrushAction.strokePoints.length} points)`
    }
    return action.action.tool
  }

  function clearAllHistory() {
    if (confirm("Clear all history? This will clear the canvas and cannot be undone.")) {
      engine.clearHistory()
      updateHistoryList()
    }
  }

  // Initial update
  updateHistoryList()

  // Listen for history changes
  engine.addListener(EventType.draw, updateHistoryList)
  engine.addListener(EventType.undo, updateHistoryList)
  engine.addListener(EventType.redo, updateHistoryList)
  engine.addListener(EventType.clear, updateHistoryList)
  engine.addListener(EventType.historyDeleted, updateHistoryList)
  engine.addListener(EventType.historyReady, updateHistoryList)

  // Add cleanup function to container
  container.cleanup = () => {
    engine.removeListener(EventType.draw, updateHistoryList)
    engine.removeListener(EventType.undo, updateHistoryList)
    engine.removeListener(EventType.redo, updateHistoryList)
    engine.removeListener(EventType.clear, updateHistoryList)
    engine.removeListener(EventType.historyDeleted, updateHistoryList)
    engine.removeListener(EventType.historyReady, updateHistoryList)
  }

  return container
}
