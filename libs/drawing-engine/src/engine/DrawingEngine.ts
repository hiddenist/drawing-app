import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"
import { Layer, LayerSettings } from "./Layer"
import { SourceImage } from "../utils/image/SourceImage"
import { ToolName, ToolNames } from "../exports"
import { LineHistoryEntry, LineTool } from "../tools/LineTool"
import { InputPoint } from "../tools/InputPoint"
import { EyeDropperHistoryEntry, EyeDropperTool } from "../tools/EyeDropperTool"

type HistoryItem = LineHistoryEntry | EyeDropperHistoryEntry

interface DrawingEngineState {
  color: Color
  opacity: number
  pixelDensity: number
  width: number
  height: number
  tool: ToolName
  prevTool: ToolName
  isPressed: boolean
}

export interface DrawingEngineOptions {
  width: number
  height: number
  pixelDensity?: number
}

export interface DrawingEngineEventMap {
  draw: HistoryItem
  pickColor: { color: Color }
  previewColor: { color: Color | null }
  clear: undefined
  changeTool: { tool: ToolName }

  press: { position: Readonly<InputPoint> }
  move: { positions: ReadonlyArray<InputPoint>; isPressed: boolean }
  release: { position: Readonly<InputPoint> }
  cancel: undefined
}

export type DrawingEngineEvent<T extends DrawingEngineEventName> = {
  eventName: T
} & (DrawingEngineEventMap[T] extends undefined ? {} : DrawingEngineEventMap[T])
export type DrawingEngineEventName = keyof DrawingEngineEventMap
export type DrawingEventHandler<T extends DrawingEngineEventName> = (event: DrawingEngineEvent<T>) => void

type DrawingEventListeners = {
  [Key in DrawingEngineEventName]: Array<DrawingEventHandler<Key>>
}

const defaultTool = ToolNames.line

export class DrawingEngine {
  protected state: DrawingEngineState
  protected program: TextureDrawingProgram
  protected history: Array<HistoryItem>
  /**
   * Saved drawing layer is the layer that actions, like brush strokes, are saved to after the user finishes drawing
   * (e.g. releases the mouse, lifts the stylus, etc).
   */
  protected savedDrawingLayer: Layer
  /**
   * Active drawing layer is the layer that is updated as the user is drawing.
   * It's cleared and redrawn on each frame, and then merged down to the saved drawing layer when the user finishes
   * drawing.
   */
  protected activeDrawingLayer: Layer

  public readonly tools: {
    [ToolNames.line]: LineTool
    [ToolNames.eyedropper]: EyeDropperTool
  }

  private listeners: Partial<DrawingEventListeners> = {}

  constructor(
    public gl: WebGLRenderingContext,
    protected readonly options: DrawingEngineOptions,
  ) {
    this.state = {
      ...options,
      color: Color.BLACK,
      opacity: 255,
      isPressed: false,
      pixelDensity: options.pixelDensity ?? 1,
      tool: defaultTool,
      prevTool: defaultTool,
    }

    this.savedDrawingLayer = this.makeLayer()
    this.activeDrawingLayer = this.makeLayer({ clearBeforeDrawing: true })

    this.program = new TextureDrawingProgram(gl, this.state.pixelDensity)

    this.history = []
    this.tools = {
      [ToolNames.line]: new LineTool(this),
      [ToolNames.eyedropper]: new EyeDropperTool(this),
    }

    this.callListeners("changeTool", { tool: this.state.tool })
  }

  private makeLayer(options?: Partial<LayerSettings>) {
    return new Layer(this.gl, options)
  }

  public get pixelDensity() {
    return this.state.pixelDensity
  }

  protected set pixelDensity(pixelDensity: number) {
    this.state.pixelDensity = pixelDensity
  }

  public getCurrentColor() {
    return this.state.color
  }

  public getCurrentToolName() {
    return this.state.tool
  }

  public get activeTool() {
    return this.tools[this.state.tool]
  }

  public setTool(tool: ToolName) {
    if (this.state.tool === tool) {
      return
    }
    this.commitToSavedLayer()
    this.state.prevTool = this.state.tool
    this.state.tool = tool
    this.callListeners("changeTool", { tool })
  }

  public usePrevTool() {
    this.setTool(this.state.prevTool)
  }

  public setColor(color: Color) {
    this.state.color = color
  }

  public setOpacity(opacity: number) {
    this.commitToSavedLayer()
    this.state.opacity = opacity
  }

  public getOpacity() {
    return this.state.opacity
  }

  public clearCanvas() {
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.clearCurrent()
    this.program.draw(this.activeDrawingLayer, this.savedDrawingLayer)

    this.callListeners("clear", undefined)
  }

  protected clearCurrent() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  protected handlePointerDown(position: Readonly<InputPoint>) {
    this.state.isPressed = true
    this.callListeners("press", { position })
  }

  protected handlePointerUp(position: Readonly<InputPoint>) {
    this.state.isPressed = false
    this.callListeners("release", { position })
  }

  protected handlePointerMove(positions: ReadonlyArray<InputPoint>) {
    this.callListeners("move", { positions, isPressed: this.state.isPressed })
  }

  protected handleCancel() {
    this.callListeners("cancel", undefined)
  }

  public isPositionInCanvas(position: Readonly<Vec2>) {
    return position[0] >= 0 && position[0] <= this.state.width && position[1] >= 0 && position[1] <= this.state.height
  }

  public draw(drawCallback: () => HistoryItem | undefined): this {
    const layer = this.activeDrawingLayer
    this.program.createTextureImage(layer, () => {
      const drawData = drawCallback()
      if (drawData) {
        this.callListeners("draw", drawData)
      }
    })
    this.render()
    return this
  }

  public loadImage(image: SourceImage) {
    const imageLayer = new Layer(this.gl, { ...this.activeDrawingLayer.settings }, image)
    this.activeDrawingLayer = imageLayer
    this.commitToSavedLayer()
  }

  public resizeCanvas(width: number, height: number) {
    this.state.width = width
    this.state.height = height
    this.gl.canvas.width = width
    this.gl.canvas.height = height
    this.resizeViewport(width, height)
  }

  protected resizeViewport(width: number, height: number, offsetX = 0, offsetY = 0) {
    this.gl.viewport(offsetX, offsetY, width, height)
  }

  protected render() {
    this.program.draw(this.activeDrawingLayer, this.savedDrawingLayer)
  }

  public addListener<E extends DrawingEngineEventName>(eventName: E, cb: DrawingEventHandler<E>) {
    let listeners = this.listeners[eventName]
    if (!listeners) {
      listeners = []
      this.listeners[eventName] = listeners
    }
    listeners.push(cb)
    return this
  }

  public removeListener<E extends DrawingEngineEventName>(eventName: E, cb: DrawingEventHandler<E>) {
    const index = this.listeners[eventName]?.indexOf(cb) ?? -1
    if (index === -1) {
      return this
    }
    this.listeners[eventName]?.splice(index, 1)
    return this
  }

  public callListeners<E extends DrawingEngineEventName>(eventName: E, data: DrawingEngineEventMap[E]) {
    this.listeners[eventName]?.forEach((listener) => listener({ eventName, ...data }))
  }

  public commitToSavedLayer() {
    const copy = this.program.mergeDown(this.activeDrawingLayer, this.savedDrawingLayer)
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.savedDrawingLayer = copy
    this.render()
  }

  public addHistory(historyItem: HistoryItem) {
    this.history.push(historyItem)
  }
}
