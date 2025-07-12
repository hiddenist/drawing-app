/// <reference types="vite/types/importMeta.d.ts" />
import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"

type ClearInfo = { tool: "clear" }
export type ToolInfo = LineDrawInfo | ClearInfo



export class CanvasHistory {
  private memoryHistory: ToolInfo[] = []
  private redoStack: ToolInfo[] = []

  constructor(
    protected readonly engine: DrawingEngine,
  ) {
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
    // Add to memory for instant undo/redo
    this.memoryHistory.push(toolInfo)
    this.redoStack = [] // Clear redo stack on new action
  }

  public undo(): boolean {
    console.log('=== UNDO START ===')
    console.log('CanvasHistory.undo called, memory history length:', this.memoryHistory.length)

    if (this.memoryHistory.length === 0) {
      console.log('No history to undo')
      return false
    }

    // Remove from memory immediately
    const action = this.memoryHistory.pop()!
    this.redoStack.push(action)
    console.log('Undoing action:', action.tool, 'Memory history now has:', this.memoryHistory.length)

    // Redraw from memory (fast!)
    console.log('About to call redraw for undo...')
    this.redrawFromMemory()
    console.log('=== UNDO END ===')

    return true
  }

  public redo(): boolean {
    console.log('=== REDO START ===')
    console.log('Redo stack length:', this.redoStack.length)

    if (this.redoStack.length === 0) {
      return false
    }

    // Add back to memory
    const action = this.redoStack.pop()!
    this.memoryHistory.push(action)
    console.log('Redoing action:', action.tool, 'Memory history now has:', this.memoryHistory.length)

    // Redraw from memory
    console.log('About to call redraw for redo...')
    this.redrawFromMemory()
    console.log('=== REDO END ===')

    return true
  }

  public canUndo(): boolean {
    return this.memoryHistory.length > 0
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  public async clearHistory() {
    this.memoryHistory = []
    this.redoStack = []
    this.engine._clear()
  }


  private redrawFromMemory() {
    console.log('=== REDRAW FROM MEMORY START ===')
    console.log('Redrawing from memory, actions:', this.memoryHistory.length)
    console.log('Memory actions:', this.memoryHistory.map(a => a.tool))

    console.log('About to clear canvas...')
    this.engine._clear()
    console.log('Canvas cleared')

    // Optimize by only replaying actions after the last clear
    const actionsSinceClear = this.getActionsSinceLastClear()
    console.log('Actions since last clear:', actionsSinceClear.length, 'of', this.memoryHistory.length)
    console.log('Actions to replay:', actionsSinceClear.map(a => a.tool))

    if (actionsSinceClear.length === 0) {
      console.log('No actions to replay - canvas will remain clear')
    } else {
      // Replay actions using proper layer management for each individual action
      for (const action of actionsSinceClear) {
        console.log('Executing action:', action.tool)
        this.executeAction(action)
      }
    }

    // Final render to display everything
    console.log('About to force render...')
    this.engine.forceRender("draw")
    console.log('Force render complete')

    console.log('=== REDRAW FROM MEMORY END ===')
  }

  private getActionsSinceLastClear(): ToolInfo[] {
    // Find the last clear action in the history
    let lastClearIndex = -1
    for (let i = this.memoryHistory.length - 1; i >= 0; i--) {
      if (this.memoryHistory[i].tool === "clear") {
        lastClearIndex = i
        break
      }
    }

    // Return all actions after the last clear (or all actions if no clear found)
    return lastClearIndex === -1
      ? this.memoryHistory
      : this.memoryHistory.slice(lastClearIndex + 1)
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

    if (tool && 'drawFromHistory' in tool) {
      if (this.isLineDrawInfo(action)) {
        try {
          this.engine.drawToActiveLayer(() => {
            tool.drawFromHistory(action.path, action.options)
          }, action.tool)
        } catch (error) {
          console.error('Error in drawFromHistory:', error)
        }
      }
    }
  }

  // Load history from properly deserialized ToolInfo actions
  public loadHistory(actions: ToolInfo[]) {
    this.memoryHistory = actions
    if (this.memoryHistory.length > 0) {
      this.redrawFromMemory()
    }
  }

  // Public API methods
  public hasHistory(): boolean {
    return this.memoryHistory.length > 0
  }

  public getHistoryLength(): number {
    return this.memoryHistory.length
  }

  public getRedoLength(): number {
    return this.redoStack.length
  }

  // Debug properties - only for debugging, not for business logic
  public get debugMemoryHistory() {
    return [...this.memoryHistory]  // Return copy to avoid naming conflict
  }

  public get debugRedoStack() {
    return [...this.redoStack]  // Return copy to avoid naming conflict
  }
}