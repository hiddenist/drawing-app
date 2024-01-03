import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"
import { Database } from "./Database"

type ClearInfo = { tool: "clear" }

export type ToolInfo = LineDrawInfo | ClearInfo

interface HistoryEntry {
  id?: IDBValidKey
  blobId: IDBValidKey | null
  actions: Array<ToolInfo>
}

interface HistoryOptions {
  maxHistory: number
  actionsPerHistory: number
}

enum HistoryStores {
  actions = "actions",
  blobs = "blobs",
}

interface HistorySchema {
  [HistoryStores.actions]: HistoryEntry
  [HistoryStores.blobs]: Blob
}

class HistoryDatabase extends Database<HistoryStores, HistorySchema> {
  static readonly name = "history"
  public actions = this.getStore(HistoryStores.actions)
  public blobs = this.getStore(HistoryStores.blobs)

  protected static schema = {
    [HistoryStores.actions]: {
      keyPath: "id",
      autoIncrement: true,
      fields: {
        blobId: {
          unique: false,
        },
        actions: {
          unique: false,
        },
      },
    },
    [HistoryStores.blobs]: {
      autoIncrement: true,
    },
  } as const

  public async deleteState(key: IDBValidKey) {
    const entry = await this.actions.get(key)
    if (!entry) {
      return
    }
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

export class CanvasHistory {
  protected history: Array<IDBValidKey> = []
  protected currentEntry: HistoryEntry | null = null
  protected redoStack: Array<ToolInfo> = []
  protected hasTruncated = false

  private constructor(
    protected readonly engine: DrawingEngine,
    protected options: HistoryOptions,
    protected db: HistoryDatabase,
  ) {
    this.engine.addListener(EventType.commit, (toolInfo) => {
      this.add(toolInfo)
    })
    this.engine.addListener(EventType.clear, () => {
      this.add({ tool: "clear" })
    })
  }

  static async create(engine: DrawingEngine, options: Partial<HistoryOptions> = {}) {
    const db = await HistoryDatabase.create()
    const history = new CanvasHistory(engine, { maxHistory: 10, actionsPerHistory: 10, ...options }, db)
    await history.restoreHistoryFromDb()
    return history
  }

  protected async restoreHistoryFromDb() {
    const historyKeys = await this.db.actions.getAllKeys()
    this.history = historyKeys.reverse()
    const state = await this.getCurrentEntry()
    if (state) {
      this.currentEntry = state.entry
      await this.drawHistoryEntry(state.entry)
    }
  }

  public setOptions(options: Partial<HistoryOptions>) {
    this.options = {
      ...this.options,
      ...options,
    }
    return this
  }

  public getOptions(): Readonly<HistoryOptions> {
    return this.options
  }

  public add(toolInfo: ToolInfo) {
    this.redoStack = []
    this.save(toolInfo)
  }

  private async save(toolInfo: ToolInfo) {
    if (this.isCurrentEntryFull() || this.currentEntry === null) {
      this.currentEntry = {
        actions: [toolInfo],
        blobId: null,
      }
      return await this.saveNewEntry()
    }

    this.currentEntry.actions.push(toolInfo)
    await this.db.actions.put(this.currentEntry)

    return { key: this.currentEntry.id, entry: this.currentEntry }
  }

  protected async saveBlob(canvas: HTMLCanvasElement) {
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not get canvas blob"))
          return
        }
        resolve(blob)
      }),
    )

    const blobId = await this.db.blobs.add(blob)
    return blobId
  }

  protected async getCurrentEntry(): Promise<{ key: IDBValidKey; entry: HistoryEntry } | null> {
    const key = this.history[0]
    if (this.currentEntry !== null) {
      return { key, entry: this.currentEntry }
    }
    if (!key) {
      return null
    }
    const entry = await this.db.actions.get(key)
    return { key, entry }
  }

  protected async saveNewEntry(): Promise<{ key: IDBValidKey; entry: HistoryEntry }> {
    if (!this.currentEntry) {
      this.currentEntry = {
        actions: [],
        blobId: null,
      }
    }
    this.currentEntry.blobId = await this.saveBlob(this.engine.htmlCanvas).catch(() => null)
    const key = await this.db.actions.add(this.currentEntry)
    this.currentEntry.id = key

    this.history.unshift(key)
    this.truncateHistory()

    return { key, entry: this.currentEntry }
  }

  public async undo() {
    if (!this.canUndo()) {
      this.engine.callListeners(EventType.undo, { toolInfo: null, canUndo: false })
      return
    }
    const currentEntry = await this.getCurrentEntry()
    if (!currentEntry) {
      return
    }

    const { key, entry } = currentEntry

    const undone = entry.actions.pop()
    if (undone) {
      this.redoStack.push(undone)
    }

    let drawEntry: HistoryEntry
    if (entry.actions.length === 0) {
      await this.db.deleteState(key)
      this.history.shift()
      if (this.history.length === 0) {
        drawEntry = {
          actions: [],
          blobId: null,
        }
      } else {
        const nextKey = this.history[0]
        drawEntry = await this.db.actions.get(nextKey)
      }
    } else {
      this.db.actions.put(entry)
      drawEntry = entry
    }

    const toolInfo = await this.drawHistoryEntry(drawEntry)
    this.engine.callListeners(EventType.undo, { toolInfo, canUndo: this.canUndo() })
  }

  public async redo() {
    const toolInfo = this.redoStack.pop()
    if (!toolInfo) {
      this.engine.callListeners(EventType.redo, { toolInfo: null, canRedo: false })
      return
    }
    const current = await this.save(toolInfo)
    await this.drawHistoryEntry(current.entry)
    this.engine.callListeners(EventType.redo, { toolInfo, canRedo: this.canRedo() })
  }

  protected isHistoryFull() {
    return this.history.length >= this.options.maxHistory
  }

  protected isCurrentEntryFull() {
    return this.currentEntry !== null && this.currentEntry.actions.length >= this.options.actionsPerHistory
  }

  protected truncateHistory() {
    if (!this.isHistoryFull()) {
      return
    }

    const first = this.history.pop()

    if (first) {
      this.db.deleteState(first)
    }
  }

  protected async drawHistoryEntry(entry: Readonly<HistoryEntry>) {
    const { actions, blobId } = entry

    const { actions: filteredActions, hasClear } = CanvasHistory.getActionsSinceClear(actions)

    this.engine._clear()
    if (!hasClear && blobId) {
      const blob = await this.db.blobs.get(blobId)
      await this.drawBlob(blob)
    }
    await this.drawActions(filteredActions)

    return actions[actions.length - 1]
  }

  protected static getActionsSinceClear(actions: Array<ToolInfo>): {
    hasClear: boolean
    actions: Array<Exclude<ToolInfo, ClearInfo>>
  } {
    const result: Array<Exclude<ToolInfo, ClearInfo>> = []
    let hasClear = false
    for (const action of actions) {
      if (action.tool === "clear") {
        hasClear = true
        result.splice(0)
      } else {
        result.push(action)
      }
    }
    return { actions: result, hasClear }
  }

  protected async drawActions(actions: Array<Exclude<ToolInfo, ClearInfo>>) {
    for (const action of actions) {
      const tool = this.engine.tools[action.tool]
      if (!tool) {
        throw new Error(`Tool ${action.tool} not found`)
      }
      tool.drawFromHistory(action.path, action.options)
      this.engine.commitToSavedLayer()
    }
  }

  protected drawBlob(blob: Blob): Promise<HTMLImageElement> {
    const image = new Image()
    image.src = URL.createObjectURL(blob)

    return new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => {
        this.engine._clear()
        this.engine.loadImage(image)
        resolve(image)
      }
      image.onerror = () => {
        reject(new Error("Could not load image"))
      }
    })
  }

  public clear() {
    this.history = []
  }

  public canUndo() {
    const minStates = this.hasTruncated ? 1 : 0

    return this.history.length > minStates
  }

  public canRedo() {
    return this.redoStack.length > 0
  }
}
