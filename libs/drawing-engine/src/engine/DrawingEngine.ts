import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import { LineDrawingProgram } from "../programs/LineDrawingProgram"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"
import { Layer, LayerSettings } from "./Layer"
import { SourceImage } from "../utils/image/SourceImage"
import { ToolName, ToolNames } from "../exports"
import { LineTool } from "../tools/LineTool"
import { InputPoint } from "../tools/InputPoint"
import { EyeDropperTool } from "../tools/EyeDropperTool"
import { CanvasHistory, ToolInfo } from "./CanvasHistory"

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

export enum EventType {
  engineLoaded = "engineLoaded",
  draw = "draw",
  commit = "commit",
  undo = "undo",
  redo = "redo",
  pickColor = "pickColor",
  previewColor = "previewColor",
  clear = "clear",
  changeTool = "changeTool",
  press = "press",
  move = "move",
  release = "release",
  cancel = "cancel",
}

export interface DrawingEngineEventMap {
  [EventType.engineLoaded]: undefined
  [EventType.draw]: ToolInfo
  [EventType.commit]: ToolInfo
  [EventType.undo]: { toolInfo: ToolInfo | null; canUndo: boolean }
  [EventType.redo]: { toolInfo: ToolInfo | null; canRedo: boolean }
  [EventType.pickColor]: { color: Color }
  [EventType.previewColor]: { color: Color | null }
  [EventType.clear]: undefined
  [EventType.changeTool]: { tool: ToolName }
  [EventType.press]: { position: Readonly<InputPoint> }
  [EventType.move]: { positions: ReadonlyArray<InputPoint>; isPressed: boolean }
  [EventType.release]: { position: Readonly<InputPoint> }
  [EventType.cancel]: undefined
}
export type DrawingEngineEvent<T extends EventType> = {
  eventName: T
} & (DrawingEngineEventMap[T] extends undefined ? {} : DrawingEngineEventMap[T])
export type DrawingEventHandler<T extends EventType> = (event: DrawingEngineEvent<T>) => void

type DrawingEventListeners = {
  [Key in EventType]: Array<DrawingEventHandler<Key>>
}

const defaultTool = ToolNames.brush

export class DrawingEngine {
  protected state: DrawingEngineState
  protected program: TextureDrawingProgram
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
    [ToolNames.brush]: LineTool
    [ToolNames.eraser]: LineTool
    [ToolNames.eyedropper]: EyeDropperTool
  }

  private listeners: Partial<DrawingEventListeners> = {}
  protected history: CanvasHistory | null = null

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

    CanvasHistory.create(this, {
      maxHistory: 10,
      actionsPerHistory: 10,
    }).then((history) => {
      this.history = history
      this.checkLoaded()
    })

    this.savedDrawingLayer = this.makeLayer()
    this.activeDrawingLayer = this.makeLayer({ clearBeforeDrawing: true })

    this.program = new TextureDrawingProgram(gl, this.state.pixelDensity)

    const lineProgram = new LineDrawingProgram(gl, this.state.pixelDensity)
    this.tools = {
      [ToolNames.brush]: new LineTool(this, lineProgram, ToolNames.brush),
      [ToolNames.eraser]: new LineTool(this, lineProgram, ToolNames.eraser),
      [ToolNames.eyedropper]: new EyeDropperTool(this),
    }

    this.callListeners(EventType.changeTool, { tool: this.state.tool })
  }

  get htmlCanvas(): HTMLCanvasElement {
    if (!(this.gl.canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas is not an HTMLCanvasElement")
    }
    return this.gl.canvas
  }

  public isLoaded() {
    return this.history !== null
  }

  private checkLoaded() {
    if (this.isLoaded()) {
      this.callListeners(EventType.engineLoaded, undefined)
    }
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

  protected getDrawMode(tool = this.getCurrentToolName()) {
    switch (tool) {
      case ToolNames.eraser:
        return "erase"
      default:
        return "draw"
    }
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
    this.callListeners(EventType.changeTool, { tool })
  }

  public getState(): Readonly<DrawingEngineState> {
    return this.state
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

  public _clear() {
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.clearCurrent()
  }

  public clearCanvas() {
    this._clear()
    this.program.draw(this.activeDrawingLayer, this.savedDrawingLayer)

    this.callListeners(EventType.clear, undefined)
  }

  protected clearCurrent() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  protected handlePointerDown(position: Readonly<InputPoint>) {
    this.state.isPressed = true
    this.callListeners(EventType.press, { position })
  }

  protected handlePointerUp(position: Readonly<InputPoint>) {
    this.state.isPressed = false
    this.callListeners(EventType.release, { position })
  }

  protected handlePointerMove(positions: ReadonlyArray<InputPoint>) {
    this.callListeners(EventType.move, { positions, isPressed: this.state.isPressed })
  }

  protected handleCancel() {
    this.callListeners(EventType.cancel, undefined)
  }

  public isPositionInCanvas(position: Readonly<Vec2>) {
    return position[0] >= 0 && position[0] <= this.state.width && position[1] >= 0 && position[1] <= this.state.height
  }

  public draw(drawCallback: () => DrawingEngineEventMap["draw"] | undefined): this {
    const layer = this.activeDrawingLayer
    this.program.createTextureImage(layer, () => {
      const drawData = drawCallback()
      if (drawData) {
        this.callListeners(EventType.draw, drawData)
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

  protected render(mode: "erase" | "draw" = this.getDrawMode()) {
    this.program[mode](this.activeDrawingLayer, this.savedDrawingLayer)
  }

  public addListener<E extends EventType>(eventName: E, cb: DrawingEventHandler<E>) {
    let listeners = this.listeners[eventName]
    if (!listeners) {
      listeners = []
      this.listeners[eventName] = listeners
    }
    listeners.push(cb)
    return this
  }

  public removeListener<E extends EventType>(eventName: E, cb: DrawingEventHandler<E>) {
    const index = this.listeners[eventName]?.indexOf(cb) ?? -1
    if (index === -1) {
      return this
    }
    this.listeners[eventName]?.splice(index, 1)
    return this
  }

  public callListeners<E extends EventType>(eventName: E, data: DrawingEngineEventMap[E]) {
    this.listeners[eventName]?.forEach((listener) => listener({ eventName, ...data }))
  }

  public commitToSavedLayer() {
    const copy = this.program.mergeDown(this.activeDrawingLayer, this.savedDrawingLayer, this.getDrawMode())
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.savedDrawingLayer = copy
    this.render("draw")
  }

  public undo() {
    return this.history?.undo()
  }

  public redo() {
    return this.history?.redo()
  }
}
