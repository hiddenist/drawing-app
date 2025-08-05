import { Database } from "../engine/Database"
import type { WorkerMessage, WorkerResponse, HistoryEntry, SerializedHistoryState } from "./types"

enum HistoryStores {
  actions = "actions",
}

interface HistorySchema {
  [HistoryStores.actions]: HistoryEntry
}

class HistoryDatabase extends Database<HistoryStores, HistorySchema> {
  static readonly name = "drawing_history"
  public actions = this.getStore(HistoryStores.actions)

  protected static schema = {
    [HistoryStores.actions]: {
      keyPath: "id",
      autoIncrement: true,
      fields: {
        timestamp: { unique: false },
      },
    },
  } as const

  public async deleteEntry(key: IDBValidKey) {
    return this.actions.delete(key)
  }

  static async create() {
    return new HistoryDatabase(
      await Database.createDb(
        HistoryDatabase.name,
        async (db, resolve) => {
          await Database.createObjectStoreAsync(db, HistoryStores.actions, this.schema[HistoryStores.actions])
          resolve()
        },
        3, // Increment version to trigger schema migration
      ),
    )
  }
}

class HistoryWorker {
  private db: HistoryDatabase | null = null
  private currentBatch: any[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly BATCH_SIZE = 5
  private readonly BATCH_DELAY = 100 // ms - reduced for more responsive saving
  private readonly STATE_KEY = "current_state" // Fixed key for current state

  async init() {
    try {
      this.db = await HistoryDatabase.create()
      this.postMessage({ type: "WORKER_READY", success: true })
    } catch (error) {
      if (error instanceof Error) {
        this.postMessage({ type: "WORKER_ERROR", error: error.message })
      } else {
        this.postMessage({ type: "WORKER_ERROR", error: "Unknown error occurred", unknownError: error })
      }
    }
  }

  async handleMessage(message: WorkerMessage) {
    const { id, type, data } = message

    try {
      switch (type) {
        case "SAVE_ACTION":
          if (data?.action) {
            await this.batchSaveAction(data.action)
            this.postMessage({ id, type: "ACTION_QUEUED", success: true })
          } else {
            this.postMessage({ id, type: "ERROR", error: "No action provided" })
          }
          break

        case "SAVE_STATE":
          if (data?.state) {
            await this.saveState(data.state)
            this.postMessage({ id, type: "STATE_SAVED", success: true })
          } else {
            this.postMessage({ id, type: "ERROR", error: "No state provided" })
          }
          break

        case "LOAD_RECENT":
          const entries = await this.loadRecentEntries(data?.limit || 10)
          this.postMessage({ id, type: "RECENT_LOADED", data: { entries }, success: true })
          break

        case "LOAD_STATE":
          const state = await this.loadState()
          this.postMessage({ id, type: "STATE_LOADED", data: { state: state || undefined }, success: true })
          break

        case "CLEAR_HISTORY":
          await this.clearHistory()
          this.postMessage({ id, type: "HISTORY_CLEARED", success: true })
          break

        case "DELETE_OLD":
          await this.deleteOldEntries(data?.keepCount || 50)
          this.postMessage({ id, type: "OLD_DELETED", success: true })
          break

        case "FLUSH_BATCH":
          await this.flushBatch()
          this.postMessage({ id, type: "BATCH_FLUSHED", success: true })
          break

        case "DELETE_ACTION":
          if (data?.actionId !== undefined) {
            await this.deleteActionFromState(data.actionId)
            this.postMessage({ id, type: "ACTION_DELETED", success: true })
          } else {
            this.postMessage({ id, type: "ERROR", error: "No action ID provided" })
          }
          break

        default:
          this.postMessage({ id, type: "ERROR", error: `Unknown message type: ${type}` })
      }
    } catch (error) {
      if (error instanceof Error) {
        this.postMessage({
          id,
          type: "ERROR",
          error: error.message || "Unknown error occurred",
        })
      } else {
        this.postMessage({ id, type: "ERROR", error: "Unknown error occurred", unknownError: error })
      }
    }
  }

  private async batchSaveAction(action: any) {
    this.currentBatch.push(action)

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    // Save immediately if batch is full
    if (this.currentBatch.length >= this.BATCH_SIZE) {
      await this.flushBatch()
    } else {
      // Otherwise, schedule a delayed save
      this.batchTimeout = setTimeout(() => {
        this.flushBatch()
      }, this.BATCH_DELAY)
    }
  }

  private async flushBatch() {
    if (!this.db || this.currentBatch.length === 0) return

    const actionsToSave = [...this.currentBatch]
    this.currentBatch = []

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    // For backward compatibility - convert actions to a simple state
    const entry: HistoryEntry = {
      state: {
        actions: actionsToSave.map((action, index) => ({ id: index + 1, action })),
        currentIndex: actionsToSave.length,
      },
      timestamp: Date.now(),
    }

    const id = await this.db.actions.add(entry)
    // Convert IDBValidKey to our restricted type - in practice this will be a number from autoIncrement
    const safeId = typeof id === "string" || typeof id === "number" ? id : String(id)
    this.postMessage({ type: "BATCH_SAVED", data: { id: safeId, actionCount: actionsToSave.length } })
  }

  private async loadRecentEntries(limit: number): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error("Database not initialized")

    const allEntries = await this.db.actions.getAll()
    return allEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit)
  }

  private async clearHistory() {
    if (!this.db) throw new Error("Database not initialized")

    await this.db.actions.clear()

    this.currentBatch = []
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }

  private async saveState(state: SerializedHistoryState) {
    if (!this.db) throw new Error("Database not initialized")

    const entry: HistoryEntry = {
      state,
      timestamp: Date.now(),
    }

    // Always use the same key for current state - this will overwrite previous state
    await this.db.actions.put({ ...entry, id: this.STATE_KEY })
  }

  private async loadState(): Promise<SerializedHistoryState | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const entry = await this.db.actions.get(this.STATE_KEY)
      return entry?.state || null
    } catch (error) {
      console.warn("Failed to load state:", error)
      return null
    }
  }

  private async deleteOldEntries(keepCount: number) {
    if (!this.db) throw new Error("Database not initialized")

    const allKeys = await this.db.actions.getAllKeys()
    if (allKeys.length <= keepCount) return

    const keysToDelete = allKeys.slice(keepCount)

    for (const key of keysToDelete) {
      await this.db.deleteEntry(key)
    }
  }

  private async deleteActionFromState(actionId: number) {
    if (!this.db) throw new Error("Database not initialized")

    // Load current state
    const currentState = await this.loadState()
    if (!currentState) {
      console.warn("No state found to delete action from")
      return
    }

    // Find and remove the action
    const actionIndex = currentState.actions.findIndex((a) => a.id === actionId)
    if (actionIndex === -1) {
      console.warn(`Action with ID ${actionId} not found in state`)
      return
    }

    // Remove the action
    currentState.actions.splice(actionIndex, 1)

    // Adjust current index if needed (similar logic to base class)
    if (currentState.currentIndex === actionId) {
      // If we're deleting the current action, move to the previous one
      if (actionIndex > 0) {
        currentState.currentIndex = currentState.actions[actionIndex - 1].id
      } else {
        // If we deleted the first action, move to empty state or next action
        currentState.currentIndex = currentState.actions.length > 0 ? currentState.actions[0].id : 0
      }
    } else if (currentState.currentIndex > actionId) {
      // Current index remains the same ID, but we need to check if it still exists
      const currentStillExists = currentState.actions.some((a) => a.id === currentState.currentIndex)
      if (!currentStillExists) {
        // Find the closest previous action
        const validActions = currentState.actions.filter((a) => a.id < currentState.currentIndex)
        currentState.currentIndex = validActions.length > 0 ? validActions[validActions.length - 1].id : 0
      }
    }

    // Save the updated state
    await this.saveState(currentState)
  }

  private postMessage(message: WorkerResponse) {
    self.postMessage(message)
  }
}

// Worker entry point
const worker = new HistoryWorker()
worker.init()

self.addEventListener("message", (e: MessageEvent<WorkerMessage>) => {
  worker.handleMessage(e.data)
})
