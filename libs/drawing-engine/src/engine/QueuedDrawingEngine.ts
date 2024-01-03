import { Color } from "@libs/shared"
import { CallbackQueue } from "./CallbackQueue"
import { DrawingEngineOptions, DrawingEventHandler, EventType } from "./DrawingEngine"
import { WebDrawingEngine } from "./WebDrawingEngine"
import { ToolName } from "../exports"
import { SourceImage } from "../utils/image/SourceImage"
import { CanvasHistory } from "./CanvasHistory"

type IDrawingEngine = Pick<
  WebDrawingEngine,
  | "getCurrentColor"
  | "getOpacity"
  | "activeTool"
  | "clearCanvas"
  | "setOpacity"
  | "tools"
  | "setColor"
  | "setTool"
  | "loadImage"
  | "getDataUri"
  | "getCurrentToolName"
>

export class QueuedDrawingEngine implements IDrawingEngine {
  private queue = new CallbackQueue()
  private engine: WebDrawingEngine
  private history: CanvasHistory | null = null

  constructor(root: HTMLElement, options: DrawingEngineOptions) {
    this.engine = new WebDrawingEngine(root, options)

    this.enqueue(() => this.setupHistory())
    this.enqueue(() => this.engine.callListeners(EventType.engineLoaded, undefined))
  }

  private async setupHistory() {
    this.history = await CanvasHistory.create(this.engine, {
      maxHistory: 10,
      actionsPerHistory: 10,
    })
  }

  public addListener<E extends EventType>(eventName: E, cb: DrawingEventHandler<E>) {
    this.engine.addListener(eventName, cb)
    return this
  }

  private enqueue(cb: () => void | Promise<void>) {
    // this.queue.push(cb)
    cb()
  }

  public setTool(tool: ToolName) {
    this.enqueue(() => this.engine.setTool(tool))
  }

  public setOpacity(opacity: number) {
    this.enqueue(() => this.engine.setOpacity(opacity))
  }

  public setColor(color: Color) {
    this.enqueue(() => this.engine.setColor(color))
  }

  public loadImage(image: SourceImage) {
    this.enqueue(() => this.engine.loadImage(image))
  }

  public undo() {
    this.enqueue(() => this.history?.undo())
  }

  public redo() {
    this.enqueue(() => this.history?.redo())
  }

  public clearCanvas() {
    this.enqueue(() => this.engine.clearCanvas())
  }

  public getDataUri() {
    return this.engine.getDataUri()
  }

  public getCurrentColor() {
    return this.engine.getCurrentColor()
  }

  public getOpacity() {
    return this.engine.getOpacity()
  }

  public getCurrentToolName(): ToolName {
    return this.engine.getCurrentToolName()
  }

  public get tools() {
    return this.engine.tools
  }

  public get activeTool() {
    return this.engine.activeTool
  }
}
