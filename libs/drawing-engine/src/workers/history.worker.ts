import { Database } from "../engine/Database"

interface HistoryEntry {
  id?: IDBValidKey
  blobId: IDBValidKey | null
  actions: Array<any>
  timestamp: number
}

enum HistoryStores {
  actions = "actions",
  blobs = "blobs",
}

interface HistorySchema {
  [HistoryStores.actions]: HistoryEntry
  [HistoryStores.blobs]: Blob
}

interface WorkerMessage {
  id: string
  type: 'SAVE_ACTION' | 'SAVE_SNAPSHOT' | 'LOAD_RECENT' | 'CLEAR_HISTORY' | 'DELETE_OLD' | 'FLUSH_BATCH'
  data?: any
}

interface WorkerResponse {
  id?: string
  type: string
  data?: any
  error?: string
  success?: boolean
  unknownError?: unknown
}

class HistoryDatabase extends Database<HistoryStores, HistorySchema> {
  static readonly name = "drawing_history"
  public actions = this.getStore(HistoryStores.actions)
  public blobs = this.getStore(HistoryStores.blobs)

  protected static schema = {
    [HistoryStores.actions]: {
      keyPath: "id",
      autoIncrement: true,
      fields: {
        timestamp: { unique: false },
        blobId: { unique: false },
      },
    },
    [HistoryStores.blobs]: {
      autoIncrement: true,
    },
  } as const

  public async deleteEntry(key: IDBValidKey) {
    const entry = await this.actions.get(key)
    if (!entry) return

    if (entry.blobId) {
      await this.blobs.delete(entry.blobId)
    }
    return this.actions.delete(key)
  }

  static async create() {
    return new HistoryDatabase(
      await Database.createDb(
        HistoryDatabase.name,
        async (db, resolve) => {
          await Promise.all([
            Database.createObjectStoreAsync(db, HistoryStores.actions, this.schema[HistoryStores.actions]),
            Database.createObjectStoreAsync(db, HistoryStores.blobs, this.schema[HistoryStores.blobs]),
          ])
          resolve()
        },
        1,
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

  async init() {
    try {
      this.db = await HistoryDatabase.create()
      this.postMessage({ type: 'WORKER_READY', success: true })
    } catch (error) {
      if (error instanceof Error) {
        this.postMessage({ type: 'WORKER_ERROR', error: error.message })
      } else {
        this.postMessage({ type: 'WORKER_ERROR', error: 'Unknown error occurred', unknownError: error })
      }
    }
  }

  async handleMessage(message: WorkerMessage) {
    const { id, type, data } = message

    try {
      switch (type) {
        case 'SAVE_ACTION':
          await this.batchSaveAction(data.action)
          this.postMessage({ id, type: 'ACTION_QUEUED', success: true })
          break

        case 'SAVE_SNAPSHOT':
          const blobId = await this.saveSnapshot(data.blob)
          this.postMessage({ id, type: 'SNAPSHOT_SAVED', data: { blobId }, success: true })
          break

        case 'LOAD_RECENT':
          const entries = await this.loadRecentEntries(data.limit || 10)
          this.postMessage({ id, type: 'RECENT_LOADED', data: { entries }, success: true })
          break

        case 'CLEAR_HISTORY':
          await this.clearHistory()
          this.postMessage({ id, type: 'HISTORY_CLEARED', success: true })
          break

        case 'DELETE_OLD':
          await this.deleteOldEntries(data.keepCount || 50)
          this.postMessage({ id, type: 'OLD_DELETED', success: true })
          break

        case 'FLUSH_BATCH':
          await this.flushBatch()
          this.postMessage({ id, type: 'BATCH_FLUSHED', success: true })
          break

        default:
          this.postMessage({ id, type: 'ERROR', error: `Unknown message type: ${type}` })
      }
    } catch (error) {
      if (error instanceof Error) {
      this.postMessage({
        id,
        type: 'ERROR',
          error: error.message || 'Unknown error occurred',
        })
      } else {
        this.postMessage({ id, type: 'ERROR', error: 'Unknown error occurred', unknownError: error })
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

    const entry: HistoryEntry = {
      actions: actionsToSave,
      blobId: null,
      timestamp: Date.now(),
    }

    const id = await this.db.actions.add(entry)
    this.postMessage({ type: 'BATCH_SAVED', data: { id, actionCount: actionsToSave.length } })
  }

  private async saveSnapshot(blob: Blob): Promise<IDBValidKey> {
    if (!this.db) throw new Error('Database not initialized')
    return this.db.blobs.add(blob)
  }

  private async loadRecentEntries(limit: number): Promise<HistoryEntry[]> {
    if (!this.db) throw new Error('Database not initialized')

    const allEntries = await this.db.actions.getAll()
    return allEntries
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit)
  }

  private async clearHistory() {
    if (!this.db) throw new Error('Database not initialized')

    await Promise.all([
      this.db.actions.clear(),
      this.db.blobs.clear()
    ])

    this.currentBatch = []
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }

  private async deleteOldEntries(keepCount: number) {
    if (!this.db) throw new Error('Database not initialized')

    const allKeys = await this.db.actions.getAllKeys()
    if (allKeys.length <= keepCount) return

    const keysToDelete = allKeys.slice(keepCount)

    for (const key of keysToDelete) {
      await this.db.deleteEntry(key)
    }
  }

  private postMessage(message: WorkerResponse) {
    self.postMessage(message)
  }
}

// Worker entry point
const worker = new HistoryWorker()
worker.init()

self.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
  worker.handleMessage(e.data)
})