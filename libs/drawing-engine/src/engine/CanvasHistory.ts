import { LineDrawInfo } from "../tools/LineTool"
import { EyeDropperInfo } from "../tools/EyeDropperTool"
import { DrawingEngine } from "./DrawingEngine"

type ToolInfo = LineDrawInfo | EyeDropperInfo

export interface HistoryState {
  toolInfo: ToolInfo
  imageData: string | null
}

interface HistoryOptions {
  maxHistory: number
}

export class CanvasHistory {
  protected redoHistory: Array<Readonly<HistoryState>> = []
  protected history: Array<Readonly<HistoryState>> = []
  protected hasTruncated = false

  constructor(
    protected readonly engine: DrawingEngine,
    protected options: HistoryOptions,
  ) {
    if (!options.maxHistory || options.maxHistory < 1) {
      options.maxHistory = 10
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

  protected async getBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Could not get blob from canvas")
        }
        resolve(blob)
      })
    })
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

  public async redo() {
    const state = this.redoHistory.pop()
    if (!state) {
      return
    }
    this.history.push(state)
    return await this.drawState(state)
  }

  public async undo() {
    const state = this.history.pop()
    console.log("Undoing", state)
    if (!state) {
      return
    }
    const currentState = this.history[this.history.length - 1]
    this.redoHistory.push(state)
    return await this.drawState(currentState)
  }

  protected addHistory(state: HistoryState) {
    console.log("Adding history", state)
    if (this.history.length >= this.options.maxHistory) {
      this.hasTruncated = true
      this.history.shift()
    }
    this.history.push(state)
    this.redoHistory = []
  }

  protected drawState(state: Readonly<HistoryState> | null) {
    if (!state) {
      if (!this.hasTruncated) this.engine.clearCanvas()
      return Promise.resolve(null)
    }
    const { toolInfo, imageData } = state
    console.log("Drawing state", state)
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

  public getHistory(): Readonly<{ undo: ReadonlyArray<HistoryState>; redo: ReadonlyArray<HistoryState> }> {
    return {
      undo: this.history,
      redo: this.redoHistory,
    }
  }

  public canUndo() {
    const minStates = this.hasTruncated ? 1 : 0
    return this.history.length > minStates
  }

  public canRedo() {
    return this.redoHistory.length > 0
  }
}
