import { CanvasHistory, ToolInfo, HistoryAction, HistoryState } from "./CanvasHistory"
import { DrawingEngine } from "./DrawingEngine"
import { Color } from "@libs/shared"
import { LineDrawInfo } from "../tools/LineTool"
import { SoftBrushDrawInfo } from "../tools/SoftBrushTool"
import { InputPoint } from "../tools/InputPoint"
import type {
  SerializedColor,
  SerializedToolInfo,
  SerializedLineDrawInfo,
  SerializedSoftBrushDrawInfo,
  SerializedHistoryState,
  WorkerMessage,
  WorkerResponse,
} from "../workers/types"

/**
 * Extends CanvasHistory with IndexedDB persistence via Web Worker
 * Falls back to memory-only if worker fails
 */
export class CanvasHistoryPersistent extends CanvasHistory {
  private worker: Worker | null = null
  private isWorkerReady = false
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>()

  constructor(engine: DrawingEngine) {
    super(engine)
    this.initWorker()
  }

  static async create(engine: DrawingEngine): Promise<CanvasHistoryPersistent> {
    const history = new CanvasHistoryPersistent(engine)

    // Wait for worker to be ready or timeout
    try {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Worker initialization timeout, falling back to memory-only mode")
          resolve() // Don't reject, just continue without worker
        }, 5000)

        const checkReady = () => {
          if (history.isWorkerReady) {
            clearTimeout(timeout)
            resolve()
          } else {
            setTimeout(checkReady, 100)
          }
        }
        checkReady()
      })

      // Load history if worker is ready
      if (history.isWorkerReady) {
        await history.loadRecentHistory()
      }
    } catch (error) {
      console.warn("Worker initialization failed, using memory-only mode:", error)
    }

    // Set up cleanup on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        history.flushPendingActions()
      })
    }

    return history
  }

  private initWorker() {
    try {
      this.worker = new Worker(new URL("../workers/history.worker.ts", import.meta.url), { type: "module" })

      this.worker.addEventListener("message", (e: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(e.data)
      })

      this.worker.addEventListener("error", (error) => {
        console.error("History worker error:", error)
        this.isWorkerReady = false
      })
    } catch (error) {
      console.warn("Failed to initialize history worker, falling back to memory-only mode:", error)
      this.isWorkerReady = false
    }
  }

  private handleWorkerMessage(message: WorkerResponse) {
    if (message.type === "WORKER_READY") {
      this.isWorkerReady = true
      return
    }

    if (message.type === "BATCH_SAVED") {
      // Optional: Handle batch save confirmations
      return
    }

    // Handle responses to specific requests
    const { id } = message
    if (id) {
      const pending = this.pendingRequests.get(id)
      if (pending) {
        this.pendingRequests.delete(id)
        if (message.type === "ERROR") {
          pending.reject(new Error(message.error))
        } else {
          pending.resolve(message)
        }
      }
    }
  }

  private sendToWorker<T extends WorkerMessage>(type: T["type"], data?: T["data"]): Promise<WorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!this.worker || !this.isWorkerReady) {
        return reject(new Error("Worker not available"))
      }
      const id = crypto.randomUUID()

      this.pendingRequests.set(id, { resolve, reject })

      const message: WorkerMessage = { id, type, data }
      this.worker.postMessage(message)

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error("Worker request timeout"))
        }
      }, 10000)
    })
  }

  // Override add to also persist to worker
  public add(toolInfo: ToolInfo) {
    // Check if we're branching from undo (redo stack has items)
    const hadRedoItems = this.getRedoLength() > 0

    // Call parent for memory handling (this will update currentIndex and handle branching)
    super.add(toolInfo)

    // Always rebuild persistence to match current timeline since parent handles branching
    if (hadRedoItems) {
      console.log("Branching detected - rebuilding persistence from current memory timeline")
      this.rebuildPersistenceFromMemory()
    } else {
      // Normal case - persist the current state
      this.persistCurrentState()
    }
  }

  // Override undo to also persist the new state
  public undo(): boolean {
    const result = super.undo()
    if (result) {
      // Persist the new current state after undo
      this.persistCurrentState()
    }
    return result
  }

  // Override redo to also persist the new state
  public redo(): boolean {
    const result = super.redo()
    if (result) {
      // Persist the new current state after redo
      this.persistCurrentState()
    }
    return result
  }

  private persistCurrentState() {
    if (!this.isWorkerReady) return

    const currentState = this.getHistoryState()
    const serializedState = this.serializeHistoryState(currentState)
    this.sendToWorker("SAVE_STATE", { state: serializedState }).catch((error) => {
      console.warn("Failed to persist state:", error)
      // App continues working even if persistence fails
    })
  }

  private rebuildPersistenceFromMemory() {
    if (!this.isWorkerReady) return

    console.log("Rebuilding persistence from current memory timeline")

    // Clear all persistent history and save current state
    this.sendToWorker("CLEAR_HISTORY")
      .then(() => {
        const currentState = this.getHistoryState()
        console.log(
          `Rebuilding persistence with ${currentState.actions.length} actions, index: ${currentState.currentIndex}`,
        )

        const serializedState = this.serializeHistoryState(currentState)
        return this.sendToWorker("SAVE_STATE", { state: serializedState })
      })
      .then(() => {
        console.log("Rebuilt persistence successfully")
      })
      .catch((error) => {
        console.warn("Failed to rebuild persistence:", error)
      })
  }

  private async loadRecentHistory() {
    if (!this.isWorkerReady) return

    try {
      const response = await this.sendToWorker("LOAD_STATE")
      const serializedState = response.data?.state

      if (!serializedState) {
        console.log("No persistent history found")
        return
      }

      console.log(
        `Loading ${serializedState.actions.length} actions from persistent storage, index: ${serializedState.currentIndex}`,
      )

      // Convert serialized actions to proper HistoryActions
      const deserializedActions: HistoryAction[] = serializedState.actions.map((serializedAction) => ({
        id: serializedAction.id,
        action: this.convertToToolInfo(serializedAction.action),
      }))

      const historyState: HistoryState = {
        actions: deserializedActions,
        currentIndex: serializedState.currentIndex,
      }

      // Load into memory using parent method
      this.loadHistory(historyState)
    } catch (error) {
      console.warn("Failed to load recent history:", error)
    }
  }

  public flushPendingActions() {
    if (!this.isWorkerReady) return

    try {
      this.sendToWorker("FLUSH_BATCH")
    } catch (error) {
      console.warn("Failed to flush pending actions:", error)
    }
  }

  public async clearHistory() {
    await super.clearHistory()

    if (this.isWorkerReady) {
      try {
        await this.sendToWorker("CLEAR_HISTORY")
        // Save the empty state
        const emptyState = this.getHistoryState()
        const serializedEmptyState = this.serializeHistoryState(emptyState)
        await this.sendToWorker("SAVE_STATE", { state: serializedEmptyState })
      } catch (error) {
        console.warn("Failed to clear persistent history:", error)
      }
    }
  }

  // Override deleteAction to also update persistence
  public deleteAction(actionId: number): boolean {
    // Call parent to handle memory deletion and redraw
    const result = super.deleteAction(actionId)

    if (result && this.isWorkerReady) {
      // Update persistence to match memory state
      this.sendToWorker("DELETE_ACTION", { actionId }).catch((error) => {
        console.warn("Failed to delete action from persistence:", error)
        // Consider rebuilding persistence from memory if delete fails
        this.rebuildPersistenceFromMemory()
      })
    }

    return result
  }

  // Cleanup method
  public dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingRequests.clear()
  }

  // Serialization methods for converting between frontend and worker types
  private serializeColor(color: Color): SerializedColor {
    return {
      r: color.r,
      g: color.g,
      b: color.b,
    }
  }

  private serializeToolInfo(toolInfo: ToolInfo): SerializedToolInfo {
    if (toolInfo.tool === "clear") {
      return { tool: "clear" }
    }

    if (toolInfo.tool === "import") {
      return { tool: "import", imageName: toolInfo.imageName, imageData: toolInfo.imageData }
    }

    // Only serialize brush, eraser, and soft brush tools (eyedropper doesn't get stored)
    if (toolInfo.tool === "eyedropper") {
      throw new Error("Eyedropper tool should not be serialized")
    }

    if (toolInfo.tool === "softBrush" || toolInfo.tool === "softEraser") {
      const softBrushInfo = toolInfo as SoftBrushDrawInfo
      return {
        tool: softBrushInfo.tool as "softBrush" | "softEraser",
        strokePoints: softBrushInfo.strokePoints.map((point) => ({
          x: point.x,
          y: point.y,
          radius: point.radius,
          hardness: point.hardness,
          flow: point.flow,
        })),
        options: {
          color: this.serializeColor(softBrushInfo.options.color),
          opacity: softBrushInfo.options.opacity,
        },
      }
    }

    // Must be line drawing tool (brush or eraser)
    const lineDrawInfo = toolInfo as LineDrawInfo
    return {
      tool: lineDrawInfo.tool as "brush" | "eraser",
      path: lineDrawInfo.path.map((point) => [point[0], point[1], point[2]]),
      options: {
        color: this.serializeColor(lineDrawInfo.options.color),
        opacity: lineDrawInfo.options.opacity,
        diameter: lineDrawInfo.options.diameter,
      },
    }
  }

  private serializeHistoryState(historyState: HistoryState): SerializedHistoryState {
    return {
      actions: historyState.actions.map((action) => ({
        id: action.id,
        action: this.serializeToolInfo(action.action),
      })),
      currentIndex: historyState.currentIndex,
    }
  }

  // Type guards and conversion methods
  private isSerializedLineDrawInfo(action: SerializedToolInfo): action is SerializedLineDrawInfo {
    return action.tool === "brush" || action.tool === "eraser"
  }

  private isSerializedSoftBrushDrawInfo(action: SerializedToolInfo): action is SerializedSoftBrushDrawInfo {
    return action.tool === "softBrush" || action.tool === "softEraser"
  }

  private convertSerializedPath(serializedPath: Array<[number, number, number?]>): InputPoint[] {
    return serializedPath.map((point) => {
      const inputPoint: InputPoint = [point[0], point[1]]
      if (point[2] !== undefined) {
        inputPoint[2] = point[2]
      }
      return inputPoint
    })
  }

  private isSerializedColor(color: any): color is SerializedColor {
    return color && typeof color === "object" && !(color instanceof Color)
  }

  private convertSerializedColor(serializedColor: SerializedColor): Color {
    if (serializedColor.vector) {
      // Check if it's already a Uint8ClampedArray or convert from regular array
      if (serializedColor.vector instanceof Uint8ClampedArray) {
        return new Color(serializedColor.vector)
      } else if (Array.isArray(serializedColor.vector) && serializedColor.vector.length >= 3) {
        return new Color(serializedColor.vector[0] ?? 0, serializedColor.vector[1] ?? 0, serializedColor.vector[2] ?? 0)
      }
    }

    // Use individual r,g,b,a properties
    return new Color(serializedColor.r ?? 0, serializedColor.g ?? 0, serializedColor.b ?? 0)
  }

  private convertToToolInfo(action: SerializedToolInfo): ToolInfo {
    if (action.tool === "clear") {
      return action
    }

    if (action.tool === "import") {
      return action
    }

    if (this.isSerializedLineDrawInfo(action)) {
      const lineAction = action
      const convertedPath = this.convertSerializedPath(lineAction.path)

      if (lineAction.options.color && this.isSerializedColor(lineAction.options.color)) {
        // Need to convert serialized color back to Color instance
        const color = this.convertSerializedColor(lineAction.options.color)

        const result: LineDrawInfo = {
          tool: lineAction.tool,
          path: convertedPath,
          options: {
            ...lineAction.options,
            color,
          },
        }
        return result
      }

      // Already a proper ToolInfo with Color instance
      const color = lineAction.options.color
      if (color && !this.isSerializedColor(color)) {
        const result: LineDrawInfo = {
          tool: lineAction.tool,
          path: convertedPath,
          options: {
            color: color,
            opacity: lineAction.options.opacity,
            diameter: lineAction.options.diameter,
          },
        }
        return result
      }

      // Fallback - shouldn't happen, but create with black color
      const result: LineDrawInfo = {
        tool: lineAction.tool,
        path: convertedPath,
        options: {
          color: Color.BLACK,
          opacity: lineAction.options.opacity,
          diameter: lineAction.options.diameter,
        },
      }
      return result
    }

    if (this.isSerializedSoftBrushDrawInfo(action)) {
      const softBrushAction = action

      if (softBrushAction.options.color && this.isSerializedColor(softBrushAction.options.color)) {
        // Need to convert serialized color back to Color instance
        const color = this.convertSerializedColor(softBrushAction.options.color)

        const result: SoftBrushDrawInfo = {
          tool: softBrushAction.tool,
          strokePoints: softBrushAction.strokePoints.map((point) => ({
            x: point.x,
            y: point.y,
            radius: point.radius,
            hardness: point.hardness,
            flow: point.flow,
          })),
          options: {
            ...softBrushAction.options,
            color,
          },
        }
        return result
      }

      // Already a proper ToolInfo with Color instance
      const color = softBrushAction.options.color
      if (color && !this.isSerializedColor(color)) {
        const result: SoftBrushDrawInfo = {
          tool: softBrushAction.tool,
          strokePoints: softBrushAction.strokePoints.map((point) => ({
            x: point.x,
            y: point.y,
            radius: point.radius,
            hardness: point.hardness,
            flow: point.flow,
          })),
          options: {
            color: color,
            opacity: softBrushAction.options.opacity,
          },
        }
        return result
      }

      // Fallback - shouldn't happen, but create with black color
      const result: SoftBrushDrawInfo = {
        tool: "softBrush",
        strokePoints: softBrushAction.strokePoints.map((point) => ({
          x: point.x,
          y: point.y,
          radius: point.radius,
          hardness: point.hardness,
          flow: point.flow,
        })),
        options: {
          color: Color.BLACK,
          opacity: softBrushAction.options.opacity,
        },
      }
      return result
    }

    throw new Error("Unknown tool action type")
  }

  // Debug access
  public get debugIsWorkerReady() {
    return this.isWorkerReady
  }
}
