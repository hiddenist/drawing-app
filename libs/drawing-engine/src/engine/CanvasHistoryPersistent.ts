import { CanvasHistory, ToolInfo } from "./CanvasHistory"
import { DrawingEngine } from "./DrawingEngine"
import { Color } from "@libs/shared"
import { LineDrawInfo } from "../tools/LineTool"

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

type SerializedToolInfo = SerializedLineDrawInfo | { tool: "clear" }

interface WorkerResponse {
  id?: string
  type: string
  data?: any
  error?: string
  success?: boolean
}

interface HistoryOptions {
  maxPersistentHistory: number
}

/**
 * Extends CanvasHistory with IndexedDB persistence via Web Worker
 * Falls back to memory-only if worker fails
 */
export class CanvasHistoryPersistent extends CanvasHistory {
  private worker: Worker | null = null
  private isWorkerReady = false
  private pendingRequests = new Map<string, { resolve: Function; reject: Function }>()

  constructor(
    engine: DrawingEngine,
    private options: HistoryOptions = { maxPersistentHistory: 1000 }
  ) {
    super(engine)
    this.initWorker()
  }

  static async create(engine: DrawingEngine, options: Partial<HistoryOptions> = {}): Promise<CanvasHistoryPersistent> {
    const history = new CanvasHistoryPersistent(engine, {
      maxPersistentHistory: 1000,
      ...options,
    })

    // Wait for worker to be ready or timeout
    try {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Worker initialization timeout, falling back to memory-only mode')
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
      console.warn('Worker initialization failed, using memory-only mode:', error)
    }

    // Set up cleanup on page unload
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

  // Override add to also persist to worker
  public add(toolInfo: ToolInfo) {
    // Check if we're branching from undo (redo stack has items)
    const hadRedoItems = this.getRedoLength() > 0

    // Call parent for memory handling
    super.add(toolInfo)

    // If we branched from undo, we need to rebuild persistence to match new timeline
    if (hadRedoItems) {
      console.log('Branching from undo - rebuilding persistence from current memory timeline')
      this.rebuildPersistenceFromMemory()
    } else {
      // Normal case - just persist the new action
      this.persistAction(toolInfo)
    }
  }

  private persistAction(toolInfo: ToolInfo) {
    if (!this.isWorkerReady) return

    this.sendToWorker('SAVE_ACTION', { action: toolInfo })
      .catch(error => {
        console.warn('Failed to persist action:', error)
        // App continues working even if persistence fails
      })
  }

  private rebuildPersistenceFromMemory() {
    if (!this.isWorkerReady) return

    console.log('Rebuilding persistence from current memory timeline')

    // Clear all persistent history and rebuild from current memory state
    this.sendToWorker('CLEAR_HISTORY')
      .then(() => {
        // Re-persist all current memory actions in order
        // Note: debugMemoryHistory now only contains ToolInfo since we fixed the base class
        const currentMemory = this.debugMemoryHistory
        console.log(`Rebuilding persistence with ${currentMemory.length} actions`)

        for (const action of currentMemory) {
          this.persistAction(action)
        }

        console.log(`Rebuilt persistence with ${currentMemory.length} actions`)
      })
      .catch(error => {
        console.warn('Failed to rebuild persistence:', error)
      })
  }

  private async loadRecentHistory() {
    if (!this.isWorkerReady) return

    try {
      const response = await this.sendToWorker('LOAD_RECENT', { limit: this.options.maxPersistentHistory })
      const entries = response.data?.entries || []

      // Flatten actions from all entries, maintaining chronological order
      const serializedActions: SerializedToolInfo[] = []

      if (entries && entries.length > 0) {
        // Since entries are sorted newest first, we need to reverse them to get chronological order
        const chronologicalEntries = [...entries].reverse()

        for (const entry of chronologicalEntries) {
          // Actions from IndexedDB are serialized
          serializedActions.push(...(entry.actions || []))
        }
      }

      console.log(`Loaded ${serializedActions.length} actions from persistent storage`)

      // Convert serialized actions to proper ToolInfo before passing to parent
      const deserializedActions: ToolInfo[] = serializedActions.map(action => this.convertToToolInfo(action))

      // Load into memory using parent method
      this.loadHistory(deserializedActions)
    } catch (error) {
      console.warn('Failed to load recent history:', error)
    }
  }

  public flushPendingActions() {
    if (!this.isWorkerReady) return

    try {
      this.sendToWorker('FLUSH_BATCH')
    } catch (error) {
      console.warn('Failed to flush pending actions:', error)
    }
  }

  public async clearHistory() {
    await super.clearHistory()

    if (this.isWorkerReady) {
      try {
        await this.sendToWorker('CLEAR_HISTORY')
      } catch (error) {
        console.warn('Failed to clear persistent history:', error)
      }
    }
  }

  // Cleanup method
  public dispose() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.pendingRequests.clear()
  }

  // Conversion methods for handling serialized data
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

  private convertToToolInfo(action: SerializedToolInfo): ToolInfo {
    if (action.tool === "clear") {
      return action
    }

    // It's a line action - check if it needs color conversion
    const lineAction = action as SerializedLineDrawInfo
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

    // Already a proper ToolInfo with Color instance
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

  // Debug access
  public get debugIsWorkerReady() {
    return this.isWorkerReady
  }
}