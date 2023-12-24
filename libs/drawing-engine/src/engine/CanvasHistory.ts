import { LineDrawInfo } from "../tools/LineTool"
import { DrawingEngine, EventType } from "./DrawingEngine"
import { Database } from "./Database"

type ToolInfo = LineDrawInfo

export interface HistoryState {
  toolInfo: ToolInfo
  imageData: string | null
}

interface HistoryOptions {
  maxHistory: number
}

enum HistoryStores {
  undo = "undoHistory",
  redo = "redoHistory",
}

interface HistorySchema {
  [HistoryStores.undo]: HistoryState
  [HistoryStores.redo]: HistoryState
}

class HistoryDatabase extends Database<HistoryStores, HistorySchema> {
  public undoHistory = this.getStore(HistoryStores.undo)
  public redoHistory = this.getStore(HistoryStores.redo)

  protected static schema = {
    [HistoryStores.undo]: {
      keyPath: "id",
      autoIncrement: true,
    },
    [HistoryStores.redo]: {
      keyPath: "id",
      autoIncrement: true,
    },
  }

  static async create() {
    const db = await Database.createDb(() => {
      db.createObjectStore(HistoryStores.undo, this.schema[HistoryStores.undo])
      db.createObjectStore(HistoryStores.redo, this.schema[HistoryStores.redo])
    })
    return new HistoryDatabase(db)
  }
}

export class CanvasHistory {
  protected redoHistory: Array<IDBValidKey> = []
  protected history: Array<IDBValidKey> = []
  protected hasTruncated = false
  protected db: HistoryDatabase | null = null

  constructor(
    protected readonly engine: DrawingEngine,
    protected options: HistoryOptions,
  ) {
    if (!options.maxHistory || options.maxHistory < 1) {
      options.maxHistory = 10
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
    const historyKeys = await db.undoHistory.getKeys()
    this.history = historyKeys.reverse()
    const redoKeys = await db.redoHistory.getKeys()
    this.redoHistory = redoKeys.reverse()
    if (this.history.length > 0) {
      const last = this.history[this.history.length - 1]
      const state = await db.undoHistory.get(last)
      await this.drawState(state)
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

  public save(toolInfo: ToolInfo) {
    const canvas = this.engine.gl.canvas
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas is not an HTMLCanvasElement")
    }
    const tool = this.engine.tools[toolInfo.tool]
    if (!tool) {
      throw new Error(`Tool ${toolInfo.tool} not found`)
    }
    this.addHistory({
      toolInfo,
      imageData: tool.updatesImageData ? canvas.toDataURL() : null,
    })
  }

  public async undo() {
    if (!this.canUndo()) {
      this.engine.callListeners(EventType.undo, { toolInfo: null, canUndo: false })
      return
    }
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const undoneKey = this.history.pop()
    if (!undoneKey) {
      return
    }

    const undoneState = await this.db.undoHistory.get(undoneKey)

    const currentKey = this.history[this.history.length - 1]
    const currentState = currentKey ? await this.db.undoHistory.get(currentKey) : null
    const toolInfo = await this.drawState(currentState)
    await this.addRedo(undoneState)
    await this.db.undoHistory.delete(undoneKey)
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
    const redoneStateKey = this.redoHistory.pop()
    if (!redoneStateKey) {
      return
    }

    const state = await this.db.redoHistory.get(redoneStateKey)
    const toolInfo = await this.drawState(state)
    await this.db.undoHistory.save(state)
    await this.db.redoHistory.delete(redoneStateKey)
    this.engine.callListeners(EventType.redo, { toolInfo, canRedo: this.canRedo() })
  }

  protected addHistory(state: HistoryState) {
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const db = this.db
    db.undoHistory.save(state).then(async (key) => {
      this.history.push(key)
      if (this.history.length >= this.options.maxHistory) {
        this.hasTruncated = true
        const first = await db.undoHistory.getFirstKey()
        if (first) {
          db.undoHistory.delete(first)
        }
      }
    })
    db.redoHistory.deleteAll()
  }

  protected async addRedo(state: HistoryState) {
    if (!this.db) {
      throw new Error("Database not initialized")
    }
    const key = await this.db.redoHistory.save(state)
    this.redoHistory.push(key)
  }

  protected drawState(state: Readonly<HistoryState> | null) {
    if (!state) {
      if (!this.hasTruncated) this.engine.clearCanvas()
      return Promise.resolve(null)
    }
    const { toolInfo, imageData } = state
    if (!imageData) {
      return Promise.resolve(toolInfo)
    }
    return new Promise<HistoryState["toolInfo"]>((resolve, reject) => {
      const image = new Image()
      image.onload = () => {
        this.engine._clear()
        this.engine.loadImage(image)
        resolve(toolInfo)
      }
      image.src = imageData
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
    return this.redoHistory.length > 0
  }
}
