/// <reference types="vite/types/importMeta.d.ts" />
import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"

type ClearInfo = { tool: "clear" }
export type ToolInfo = LineDrawInfo | ClearInfo

// History action with unique ID
export interface HistoryAction {
  id: number
  action: ToolInfo
}

// History state for persistence
export interface HistoryState {
  actions: HistoryAction[]
  currentIndex: number // ID of the current action (1-indexed, 0 = empty state)
}

export class CanvasHistory {
  private actions: HistoryAction[] = []
  private currentIndex: number = 0 // 0 means empty state, 1+ are action IDs
  private nextId: number = 1 // Next ID to assign

  constructor(protected readonly engine: DrawingEngine) {
    this.setupEngineListeners()
  }

  private setupEngineListeners() {
    this.engine.addListener(EventType.draw, () => {
      // Only add to history when stroke is complete (on release)
      // The draw event fires during drawing, not at completion
    })

    // Listen for when a stroke is completed
    this.engine.addListener(EventType.release, () => {
      // This will be called by LineTool when it commits
    })
  }

  public add(toolInfo: ToolInfo) {
    // Create new action with unique ID
    const newAction: HistoryAction = {
      id: this.nextId++,
      action: toolInfo,
    }

    // Remove any actions after current position (branching timeline)
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    if (currentActionIndex >= 0) {
      this.actions = this.actions.slice(0, currentActionIndex + 1)
    }

    // Add new action
    this.actions.push(newAction)
    this.currentIndex = newAction.id

    console.log(
      `Added action ${newAction.id}, current index: ${this.currentIndex}, total actions: ${this.actions.length}`,
    )
  }

  public undo(): boolean {
    console.log("=== UNDO START ===")
    console.log("Current index:", this.currentIndex, "Total actions:", this.actions.length)

    if (this.currentIndex === 0) {
      console.log("Already at empty state, nothing to undo")
      return false
    }

    // Find the previous action
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    if (currentActionIndex <= 0) {
      // Go to empty state
      this.currentIndex = 0
    } else {
      // Go to previous action
      this.currentIndex = this.actions[currentActionIndex - 1].id
    }

    console.log("After undo, current index:", this.currentIndex)
    this.redrawFromMemory()
    console.log("=== UNDO END ===")

    return true
  }

  public redo(): boolean {
    console.log("=== REDO START ===")
    console.log("Current index:", this.currentIndex, "Total actions:", this.actions.length)

    // Find the next action after current
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    const nextIndex = currentActionIndex + 1

    if (nextIndex >= this.actions.length) {
      console.log("No actions to redo")
      return false
    }

    // Move to next action
    this.currentIndex = this.actions[nextIndex].id
    console.log("After redo, current index:", this.currentIndex)

    this.redrawFromMemory()
    console.log("=== REDO END ===")

    return true
  }

  public canUndo(): boolean {
    return this.currentIndex > 0
  }

  public canRedo(): boolean {
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    return currentActionIndex < this.actions.length - 1
  }

  public async clearHistory() {
    this.actions = []
    this.currentIndex = 0
    this.nextId = 1
    this.engine._clear()
  }

  private redrawFromMemory() {
    console.log("=== REDRAW FROM MEMORY START ===")
    console.log("Redrawing from memory, actions:", this.actions.length)
    console.log("Current index:", this.currentIndex)

    console.log("About to clear canvas...")
    this.engine._clear()
    console.log("Canvas cleared")

    // Get actions to replay up to current index
    const actionsToReplay = this.getActionsToReplay()
    console.log("Actions to replay:", actionsToReplay.length, "up to index:", this.currentIndex)
    console.log(
      "Action types:",
      actionsToReplay.map((a) => a.tool),
    )

    if (actionsToReplay.length === 0) {
      console.log("No actions to replay - canvas will remain clear")
    } else {
      // Replay actions using proper layer management for each individual action
      for (const action of actionsToReplay) {
        console.log("Executing action:", action.tool)
        this.executeAction(action)
      }
    }

    // Final render to display everything
    console.log("About to force render...")
    this.engine.forceRender("draw")
    console.log("Force render complete")

    console.log("=== REDRAW FROM MEMORY END ===")
  }

  private getActionsToReplay(): ToolInfo[] {
    // Get actions up to current index
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    const actionsToReplay = currentActionIndex >= 0 ? this.actions.slice(0, currentActionIndex + 1) : []

    // Find the last clear action
    let lastClearIndex = -1
    for (let i = actionsToReplay.length - 1; i >= 0; i--) {
      if (actionsToReplay[i].action.tool === "clear") {
        lastClearIndex = i
        break
      }
    }

    // Return actions after the last clear (or all actions if no clear found)
    const relevantActions = lastClearIndex === -1 ? actionsToReplay : actionsToReplay.slice(lastClearIndex + 1)

    return relevantActions.map((a) => a.action)
  }

  private isLineDrawInfo(action: ToolInfo): action is LineDrawInfo {
    return action.tool !== "clear"
  }

  private executeAction(action: ToolInfo) {
    if (action.tool === "clear") {
      // Clear action - already handled by _clear above
      return
    }

    // Execute line drawing action
    const tool = this.engine.tools[action.tool]

    if (tool && "drawFromHistory" in tool) {
      if (this.isLineDrawInfo(action)) {
        try {
          this.engine.drawToActiveLayer(() => {
            tool.drawFromHistory(action.path, action.options)
          }, action.tool)
        } catch (error) {
          console.error("Error in drawFromHistory:", error)
        }
      }
    }
  }

  // Load history state (actions + current position)
  public loadHistory(historyState: HistoryState) {
    this.actions = historyState.actions
    this.currentIndex = historyState.currentIndex

    // Update nextId to be higher than any existing ID
    this.nextId = Math.max(0, ...this.actions.map((a) => a.id)) + 1

    console.log(
      `Loaded history: ${this.actions.length} actions, current index: ${this.currentIndex}, next ID: ${this.nextId}`,
    )

    // Only redraw if we're not at empty state (currentIndex > 0)
    if (this.currentIndex > 0) {
      this.redrawFromMemory()
    }
  }

  // Public API methods
  public hasHistory(): boolean {
    return this.actions.length > 0
  }

  public getHistoryLength(): number {
    return this.actions.length
  }

  public getRedoLength(): number {
    const currentActionIndex = this.actions.findIndex((a) => a.id === this.currentIndex)
    return this.actions.length - 1 - currentActionIndex
  }

  public getCurrentIndex(): number {
    return this.currentIndex
  }

  public getHistoryState(): HistoryState {
    return {
      actions: [...this.actions],
      currentIndex: this.currentIndex,
    }
  }

  // Debug properties - only for debugging, not for business logic
  public get debugActions() {
    return [...this.actions] // Return copy
  }

  public get debugCurrentIndex() {
    return this.currentIndex
  }
}
