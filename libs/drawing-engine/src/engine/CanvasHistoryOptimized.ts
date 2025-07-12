/// <reference types="vite/types/importMeta.d.ts" />
import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"
import { Color } from "@libs/shared"

type ClearInfo = { tool: "clear" }
export type ToolInfo = LineDrawInfo | ClearInfo

// Types for serialized data (what gets stored in IndexedDB)
interface SerializedColor {
  r?: number
  g?: number
  b?: number
  vector?: Uint8ClampedArray | number[]
}

type SerializedLineDrawInfo = {
  tool: Exclude<LineDrawInfo["tool"], "eyedropper">
  path: LineDrawInfo["path"]
  options: Omit<LineDrawInfo["options"], "color"> & {
    color: SerializedColor | Color  // Could be either after deserialization
  }
}

type SerializedToolInfo = SerializedLineDrawInfo | ClearInfo

interface HistoryOptions {
  maxMemoryHistory: number
  maxPersistentHistory: number
  snapshotInterval: number
}


interface WorkerResponse {
  id?: string
  type: string
  data?: any
  error?: string
  success?: boolean
}

export class CanvasHistoryOptimized {
  private memoryHistory: (ToolInfo | SerializedToolInfo)[] = []
  private redoStack: (ToolInfo | SerializedToolInfo)[] = []
  private worker: Worker | null = null
  private isWorkerReady = false
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>()
  private actionsSinceSnapshot = 0

  private constructor(
    protected readonly engine: DrawingEngine,
    protected readonly options: HistoryOptions,
  ) {
    this.initWorker()
    this.setupEngineListeners()
  }

  static async create(engine: DrawingEngine, options: Partial<HistoryOptions> = {}): Promise<CanvasHistoryOptimized> {
    const history = new CanvasHistoryOptimized(engine, {
      maxMemoryHistory: 50,
      maxPersistentHistory: 500,
      snapshotInterval: 25,
      ...options,
    })

    // Wait for worker to be ready
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'))
      }, 10000)

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

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        history.flushPendingActions()
      })
    }

    return history
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('../workers/history.worker.ts', import.meta.url),
        { type: 'module' }
      )

      this.worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(e.data)
      })

      this.worker.addEventListener('error', (error) => {
        console.error('History worker error:', error)
        // Fallback to memory-only mode
        this.isWorkerReady = false
      })
    } catch (error) {
      console.warn('Failed to initialize history worker, falling back to memory-only mode:', error)
      this.isWorkerReady = false
    }
  }

  private handleWorkerMessage(message: WorkerResponse) {
    if (message.type === 'WORKER_READY') {
      this.isWorkerReady = true
      this.loadRecentHistory()
      return
    }

    if (message.type === 'BATCH_SAVED') {
      // Optional: Handle batch save confirmations
      return
    }

    // Handle responses to specific requests
    const { id } = message
    if (id) {
      const pending = this.pendingRequests.get(id)
      if (pending) {
        this.pendingRequests.delete(id)
        if (message.type === 'ERROR') {
          pending.reject(new Error(message.error))
        } else {
          pending.resolve(message)
        }
      }
    }
  }

  private sendToWorker(type: string, data?: any): Promise<WorkerResponse> {
    if (!this.worker || !this.isWorkerReady) {
      return Promise.reject(new Error('Worker not available'))
    }

    const id = crypto.randomUUID()

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })

      this.worker!.postMessage({ id, type, data })

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Worker request timeout'))
        }
      }, 10000)
    })
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

    // Note: Clear actions are now handled directly in DrawingEngine.clearCanvas()
    // this.engine.addListener(EventType.clear, () => {
    //   this.add({ tool: "clear" })
    // })
  }

  public add(toolInfo: ToolInfo) {
    // IMMEDIATE: Add to memory for instant undo/redo
    this.memoryHistory.push(toolInfo)
    this.redoStack = [] // Clear redo stack on new action
    this.trimMemoryHistory()

    // ASYNC: Send to worker (fire and forget)
    this.persistAction(toolInfo)

    // Take snapshot periodically
    this.actionsSinceSnapshot++
    if (this.actionsSinceSnapshot >= this.options.snapshotInterval) {
      this.takeSnapshot()
      this.actionsSinceSnapshot = 0
    }
  }

  private isSerializedColor(color: any): color is SerializedColor {
    return color && typeof color === 'object' && !(color instanceof Color)
  }

  private convertSerializedColor(serializedColor: SerializedColor): Color {
    if (serializedColor.vector) {
      // Check if it's already a Uint8ClampedArray or convert from regular array
      if (serializedColor.vector instanceof Uint8ClampedArray) {
        return new Color(serializedColor.vector)
      } else if (Array.isArray(serializedColor.vector) && serializedColor.vector.length >= 3) {
        return new Color(
          serializedColor.vector[0] ?? 0,
          serializedColor.vector[1] ?? 0,
          serializedColor.vector[2] ?? 0
        )
      }
    }

    // Use individual r,g,b,a properties
    return new Color(
      serializedColor.r ?? 0,
      serializedColor.g ?? 0,
      serializedColor.b ?? 0
    )
  }

  private convertToToolInfo(action: ToolInfo | SerializedToolInfo): ToolInfo {
    if (action.tool === "clear") {
      return action
    }

    // It's a line action - check if it needs color conversion
    const lineAction = action as SerializedLineDrawInfo | LineDrawInfo
    if (lineAction.options.color && this.isSerializedColor(lineAction.options.color)) {
      // Need to convert serialized color back to Color instance
      const color = this.convertSerializedColor(lineAction.options.color)

      const result: LineDrawInfo = {
        tool: lineAction.tool,
        path: lineAction.path,
        options: {
          ...lineAction.options,
          color
        }
      }
      return result
    }

    // Already a proper ToolInfo with Color instance - since isSerializedColor returned false
    if (lineAction.options.color instanceof Color) {
      const result: LineDrawInfo = {
        tool: lineAction.tool,
        path: lineAction.path,
        options: {
          color: lineAction.options.color,
          opacity: lineAction.options.opacity,
          diameter: lineAction.options.diameter
        }
      }
      return result
    }

    // Fallback - shouldn't happen, but create with black color
    const result: LineDrawInfo = {
      tool: lineAction.tool,
      path: lineAction.path,
      options: {
        color: Color.BLACK,
        opacity: lineAction.options.opacity,
        diameter: lineAction.options.diameter
      }
    }
    return result
  }

  private persistAction(toolInfo: ToolInfo | SerializedToolInfo) {
    if (!this.isWorkerReady) return

    this.sendToWorker('SAVE_ACTION', { action: toolInfo })
      .catch(error => {
        console.warn('Failed to persist action:', error)
        // App continues working even if persistence fails
      })
  }

  private async takeSnapshot() {
    if (!this.isWorkerReady) return

    try {
      const canvas = this.engine.gl.canvas
      if (!(canvas instanceof HTMLCanvasElement)) return

      // Create blob asynchronously
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to create canvas blob'))
        }, 'image/png', 0.8) // Use PNG with some compression
      })

      // Send to worker (non-blocking)
      this.sendToWorker('SAVE_SNAPSHOT', { blob })
        .catch(error => console.warn('Failed to save snapshot:', error))
    } catch (error) {
      console.warn('Failed to take snapshot:', error)
    }
  }

  public undo(): boolean {
    console.log('CanvasHistoryOptimized.undo called, memory history length:', this.memoryHistory.length)
    if (this.memoryHistory.length === 0) {
      console.log('No history to undo')
      this.engine.callListeners(EventType.undo, { toolInfo: null, canUndo: false })
      return false
    }

    // Remove from memory immediately
    const action = this.memoryHistory.pop()!
    this.redoStack.push(action)
    console.log('Undoing action:', action, 'Memory history now has:', this.memoryHistory.length)

    // Redraw from memory (fast!)
    this.redrawFromMemory()

    // Convert serialized action to ToolInfo for the listener
    const lastAction = this.memoryHistory[this.memoryHistory.length - 1]
    const toolInfoForListener = lastAction ? this.convertToToolInfo(lastAction) : null
    this.engine.callListeners(EventType.undo, { toolInfo: toolInfoForListener, canUndo: this.canUndo() })
    return true
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) {
      this.engine.callListeners(EventType.redo, { toolInfo: null, canRedo: false })
      return false
    }

    // Add back to memory
    const action = this.redoStack.pop()!
    this.memoryHistory.push(action)

    // Redraw from memory
    this.redrawFromMemory()

    // Persist the redone action
    this.persistAction(action)

    // Convert to ToolInfo for the listener
    const toolInfoForListener = this.convertToToolInfo(action)
    this.engine.callListeners(EventType.redo, { toolInfo: toolInfoForListener, canRedo: this.canRedo() })
    return true
  }

  private redrawFromMemory() {
    console.log('Redrawing from memory, actions:', this.memoryHistory.length)
    this.engine._clear()

    // Optimize by only replaying actions after the last clear
    const actionsSinceClear = this.getActionsSinceLastClear()
    console.log('Actions since last clear:', actionsSinceClear.length, 'of', this.memoryHistory.length)

    // Replay actions using proper layer management for each individual action
    for (const action of actionsSinceClear) {
      console.log('Executing action:', action)
      this.executeAction(action)
    }

    // Final render to display everything
    this.engine.forceRender("draw")

    console.log('Finished redrawing from memory')
  }

  private getActionsSinceLastClear(): (ToolInfo | SerializedToolInfo)[] {
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

  private executeAction(action: ToolInfo | SerializedToolInfo) {
    if (action.tool === "clear") {
      // Clear action - already handled by _clear above
      return
    }

    // Execute line drawing action
    const tool = this.engine.tools[action.tool]

    if (tool && 'drawFromHistory' in tool) {
      // Convert to proper ToolInfo if needed
      const properAction = this.convertToToolInfo(action)

      if (this.isLineDrawInfo(properAction)) {
        try {
          this.engine.drawToActiveLayer(() => {
            tool.drawFromHistory(properAction.path, properAction.options)
          }, properAction.tool)
        } catch (error) {
          console.error('Error in drawFromHistory:', error)
        }
      }
    }
  }

  private trimMemoryHistory() {
    if (this.memoryHistory.length > this.options.maxMemoryHistory) {
      console.debug(`Trimming memory history from ${this.memoryHistory.length} to ${this.options.maxMemoryHistory}`)
      this.memoryHistory.splice(0, this.memoryHistory.length - this.options.maxMemoryHistory)
      console.debug(`Memory history trimmed to ${this.memoryHistory.length} items`)
    }
  }

  private async loadRecentHistory() {
    if (!this.isWorkerReady) return

    try {
      const response = await this.sendToWorker('LOAD_RECENT', { limit: this.options.maxMemoryHistory })
      const entries = response.data?.entries || []

      // Flatten actions from all entries, maintaining chronological order
      const actions: SerializedToolInfo[] = []

      // Since entries are sorted newest first, we need to reverse them to get chronological order
      const chronologicalEntries = [...entries].reverse()

      for (const entry of chronologicalEntries) {
        // Actions from IndexedDB are serialized
        actions.push(...(entry.actions as SerializedToolInfo[]))
      }

      // Take the most recent actions (end of chronological array)
      this.memoryHistory = actions.slice(-this.options.maxMemoryHistory)

      // Debug info (can be removed in production)
      if (import.meta.env?.DEV) {
        console.log(`Loaded ${this.memoryHistory.length} actions from history`)
      }

      // Redraw if we have history
      if (this.memoryHistory.length > 0) {
        this.redrawFromMemory()

        // Fire event to update UI state after loading history
        const lastAction = this.memoryHistory[this.memoryHistory.length - 1]
        if (lastAction) {
          const toolInfoForUI = this.convertToToolInfo(lastAction)
          this.engine.callListeners(EventType.draw, toolInfoForUI)
        }
      }
    } catch (error) {
      console.warn('Failed to load recent history:', error)
    }
  }

  public flushPendingActions() {
    if (!this.isWorkerReady) return

    // Send flush command synchronously for page unload
    try {
      this.sendToWorker('FLUSH_BATCH')
    } catch (error) {
      console.warn('Failed to flush pending actions:', error)
    }
  }

  public async clear() {
    this.memoryHistory = []
    this.redoStack = []
    this.actionsSinceSnapshot = 0

    this.engine._clear()

    if (this.isWorkerReady) {
      try {
        await this.sendToWorker('CLEAR_HISTORY')
      } catch (error) {
        console.warn('Failed to clear persistent history:', error)
      }
    }
  }

  public canUndo(): boolean {
    return this.memoryHistory.length > 0
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  public getOptions(): HistoryOptions {
    return this.options
  }

  // Cleanup method
  public dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingRequests.clear()
  }

  // Debug properties
  public get debugMemoryHistory() {
    return [...this.memoryHistory]  // Return copy to avoid naming conflict
  }

  public get debugRedoStack() {
    return [...this.redoStack]  // Return copy to avoid naming conflict
  }

  public get debugIsWorkerReady() {
    return this.isWorkerReady
  }
}