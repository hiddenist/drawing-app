import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"
import { Database } from "./Database"

type ToolInfo = LineDrawInfo

export interface HistoryState {
  toolInfo: ToolInfo
  imageData: Blob | null
}

interface HistoryEntry {
  imageData: Blob | null
  actions: Array<ToolInfo>
}

interface HistoryOptions {
  maxHistory: number
  actionsPerHistory: number
}

enum HistoryStores {
  history = "history",
}

interface HistorySchema {
  [HistoryStores.history]: HistoryEntry
}

class HistoryDatabase extends Database<HistoryStores, HistorySchema> {
  public history = this.getStore(HistoryStores.history)

  protected static schema = {
    [HistoryStores.history]: {
      autoIncrement: true,
    },
  }

  static async create() {
    return new HistoryDatabase(
      await Database.createDb(
        "history",
        (db, resolve) => {
          const store = db.createObjectStore(HistoryStores.history, this.schema[HistoryStores.history])
          store.transaction.oncomplete = () => {
            resolve()
          }
        },
        1,
      ),
    )
  }
}

export class CanvasHistory {
  protected history: Array<IDBValidKey> = []
  protected redoStack: Array<ToolInfo> = []
  protected hasTruncated = false
  protected db: HistoryDatabase | null = null

  constructor(
    protected readonly engine: DrawingEngine,
    protected options: HistoryOptions,
  ) {
    if (!options.maxHistory || options.maxHistory < 1) {
      options.maxHistory = 10
    }

    if (!options.actionsPerHistory || options.actionsPerHistory < 1) {
      options.actionsPerHistory = 10
    }

    HistoryDatabase.create().then(async (db) => {
      this.db = db
      await this.restoreHistoryFromDb()
    })
  }

  protected async restoreHistoryFromDb() {
    const db = this.db
    if (!db) {
      throw new Error("Database not initialized")
    }
    const historyKeys = await db.history.getAllKeys()
    this.history = historyKeys.reverse()
    const state = await this.getCurrentEntry()
    if (state) {
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

  private async save(toolInfo: ToolInfo) {
    const canvas = this.engine.gl.canvas
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas is not an HTMLCanvasElement")
    }
    const tool = this.engine.tools[toolInfo.tool]
    if (!tool) {
      throw new Error(`Tool ${toolInfo.tool} not found`)
    }

    const current = await this.getIncompleteEntry()
    current.entry.actions.push(toolInfo)

    if (tool.updatesImageData && current.entry.imageData === null) {
      current.entry.imageData = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Could not get canvas blob"))
            return
          }
          resolve(blob)
        }),
      )
    }

    if (!this.db) {
      throw new Error("Database not initialized")
    }
    await this.db.history.put(current.key, current.entry)
    return current
  }

  protected async getIncompleteEntry(): Promise<{ key: IDBValidKey; entry: HistoryEntry }> {
    const current = (await this.getCurrentEntry()) ?? null
    if (!current) {
      return this.createNewEntry()
    }
    if (current.entry.actions.length >= this.options.actionsPerHistory) {
      return this.createNewEntry()
    }
    return current
  }

  protected async getCurrentEntry(): Promise<{ key: IDBValidKey; entry: HistoryEntry } | null> {
    const key = this.history[0]
    if (!key) {
      return null
    }
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const entry = await this.db.history.get(key)
    return { key, entry }
  }

  protected async createNewEntry(): Promise<{ key: IDBValidKey; entry: HistoryEntry }> {
    const state: HistoryEntry = {
      imageData: null,
      actions: [],
    }
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const key = await this.db.history.add(state)
    this.appendHistoryKey(key)
    return { key, entry: state }
  }

  public async undo() {
    if (!this.canUndo()) {
      this.engine.callListeners(EventType.undo, { toolInfo: null, canUndo: false })
      return
    }
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const key = this.history[0]
    if (!key) {
      return
    }

    const state = await this.db.history.get(key)
    const undone = state.actions.pop()
    if (undone) {
      this.redoStack.push(undone)
    }

    let drawEntry: HistoryEntry
    if (state.actions.length === 0) {
      this.db.history.delete(key)
      this.history.shift()
      const nextKey = this.history[0]
      drawEntry = await this.db.history.get(nextKey)
    } else {
      this.db.history.put(key, state)
      drawEntry = state
    }

    const toolInfo = await this.drawHistoryEntry(drawEntry)
    this.engine.callListeners(EventType.undo, { toolInfo, canUndo: this.canUndo() })
  }

  public async redo() {
    if (!this.canRedo()) {
      this.engine.callListeners(EventType.redo, { toolInfo: null, canRedo: false })
      return
    }
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const toolInfo = this.redoStack.pop()
    if (!toolInfo) {
      throw new Error("Could not get tool info from redo stack")
    }
    const current = await this.save(toolInfo)
    await this.drawHistoryEntry(current.entry)
    this.engine.callListeners(EventType.redo, { toolInfo, canRedo: this.canRedo() })
  }

  protected async appendHistoryKey(key: IDBValidKey) {
    if (!this.db) {
      throw new Error("Database not initialized")
    }

    const db = this.db
    this.history.push(key)
    if (this.history.length >= this.options.maxHistory) {
      this.hasTruncated = true
      const first = await db.history.getFirstKey()
      if (first) {
        db.history.delete(first)
      }
    }
  }

  protected async drawHistoryEntry(entry: Readonly<HistoryEntry> | null) {
    if (!entry) {
      if (!this.hasTruncated) this.engine.clearCanvas()
      return Promise.resolve(null)
    }
    const { actions, imageData } = entry
    if (!imageData) {
      this.engine._clear()
      return Promise.resolve(null)
    }
    await this.drawBlob(imageData)
    await this.drawActions(actions)
    return actions[actions.length - 1]
  }

  protected async drawActions(actions: Array<ToolInfo>) {
    for (const action of actions) {
      const tool = this.engine.tools[action.tool]
      if (!tool) {
        throw new Error(`Tool ${action.tool} not found`)
      }
      await tool.drawFromHistory(action.path, action.options)
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
