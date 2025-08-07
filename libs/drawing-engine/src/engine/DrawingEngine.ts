import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import { LineDrawingProgram } from "../programs/LineDrawingProgram"
import { SoftBrushProgram } from "../programs/SoftBrushProgram"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"
import { Layer, LayerSettings } from "./Layer"
import { SourceImage } from "../utils/image/SourceImage"
import { ToolName, ToolNames } from "../exports"
import { LineTool } from "../tools/LineTool"
import { SoftBrushTool } from "../tools/SoftBrushTool"
import { InputPoint } from "../tools/InputPoint"
import { EyeDropperTool } from "../tools/EyeDropperTool"
import { CanvasHistory, ToolInfo } from "./CanvasHistory"
import { CanvasHistoryPersistent } from "./CanvasHistoryPersistent"

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
  draw = "draw",
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
  historyReady = "historyReady",
  historyDeleted = "historyDeleted",
}

export interface DrawingEngineEventMap {
  [EventType.draw]: ToolInfo
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
  [EventType.historyReady]: { hasHistory: boolean; canUndo: boolean; canRedo: boolean }
  [EventType.historyDeleted]: { actionId: number; remainingActions: number }
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
    [ToolNames.softBrush]: SoftBrushTool
    [ToolNames.eraser]: LineTool
    [ToolNames.eyedropper]: EyeDropperTool
  }

  private listeners: Partial<DrawingEventListeners> = {}
  protected history: CanvasHistory | null = null

  constructor(
    public gl: WebGL2RenderingContext,
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

    // Initialize history asynchronously
    this.initHistory()

    this.savedDrawingLayer = this.makeLayer()
    this.activeDrawingLayer = this.makeLayer({ clearBeforeDrawing: true })

    this.program = new TextureDrawingProgram(gl, this.state.pixelDensity)

    const lineProgram = new LineDrawingProgram(gl, this.state.pixelDensity)
    const softBrushProgram = new SoftBrushProgram(gl, this.state.pixelDensity)
    this.tools = {
      [ToolNames.brush]: new LineTool(this, lineProgram, ToolNames.brush),
      [ToolNames.softBrush]: new SoftBrushTool(this, softBrushProgram, ToolNames.softBrush),
      [ToolNames.eraser]: new LineTool(this, lineProgram, ToolNames.eraser),
      [ToolNames.eyedropper]: new EyeDropperTool(this),
    }

    this.callListeners(EventType.changeTool, { tool: this.state.tool })
  }

  private async initHistory() {
    try {
      // Try to create persistent history first
      this.history = await CanvasHistoryPersistent.create(this)
      console.log("Initialized persistent history")
    } catch (error) {
      console.warn("Failed to initialize persistent history, falling back to memory-only mode:", error)
      // Fallback to memory-only history
      this.history = new CanvasHistory(this)
      console.log("Initialized memory-only history")
    }

    // Notify that history is ready
    this.callListeners(EventType.historyReady, {
      hasHistory: this.history.hasHistory(),
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
    })
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

    // Add clear action to history
    this.addHistory({ tool: "clear" })
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

  public loadImage(image: SourceImage, imageName?: string) {
    const imageLayer = new Layer(this.gl, { ...this.activeDrawingLayer.settings }, image)
    this.activeDrawingLayer = imageLayer
    this.commitToSavedLayer()

    // Convert image to base64 for history storage
    const imageData = this.imageToBase64(image)

    // Add import action to history
    this.addHistory({ tool: "import", imageName, imageData })
  }

  public loadImageFromHistory(image: SourceImage) {
    const imageLayer = new Layer(this.gl, { ...this.activeDrawingLayer.settings }, image)
    this.activeDrawingLayer = imageLayer
    this.commitToSavedLayer()
    this.render("draw")
  }

  private imageToBase64(image: SourceImage): string {
    // If it's already a data URL, return it as is
    if (image instanceof HTMLImageElement && image.src.startsWith("data:")) {
      return image.src
    }

    // Create a canvas to convert the image to base64
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2D context for image conversion")
    }

    // Set canvas size to match image
    if (image instanceof HTMLImageElement) {
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
    } else if (image instanceof HTMLCanvasElement) {
      canvas.width = image.width
      canvas.height = image.height
    } else {
      // For other types, use a default size
      canvas.width = 300
      canvas.height = 150
    }

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0)

    // Convert to base64
    return canvas.toDataURL("image/png")
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

  public forceRender(mode: "erase" | "draw" = "draw") {
    this.render(mode)
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

  public drawToActiveLayer(drawCallback: () => void, toolName: ToolName) {
    this.program.createTextureImage(this.activeDrawingLayer, drawCallback)
    const mode = this.getDrawMode(toolName)
    const copy = this.program.mergeDown(this.activeDrawingLayer, this.savedDrawingLayer, mode)
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.savedDrawingLayer = copy
  }

  public addHistory(toolInfo: ToolInfo) {
    this.history?.add(toolInfo)
  }

  public undo() {
    const result = this.history?.undo() ?? false

    if (result) {
      // Fire undo event with current state
      this.callListeners(EventType.undo, {
        toolInfo: null, // We could get the last action if needed
        canUndo: this.canUndo(),
      })
    }

    return result
  }

  public redo() {
    const result = this.history?.redo() ?? false

    if (result) {
      // Fire redo event with current state
      this.callListeners(EventType.redo, {
        toolInfo: null, // We could get the current action if needed
        canRedo: this.canRedo(),
      })
    }

    return result
  }

  public canUndo(): boolean {
    return this.history?.canUndo() ?? false
  }

  public canRedo(): boolean {
    return this.history?.canRedo() ?? false
  }

  public clearHistory() {
    return this.history?.clearHistory()
  }

  public deleteHistoryAction(actionId: number): boolean {
    const result = this.history?.deleteAction(actionId) ?? false

    if (result) {
      // Fire delete event
      this.callListeners(EventType.historyDeleted, {
        actionId,
        remainingActions: this.history?.getHistoryLength() ?? 0,
      })
    }

    return result
  }

  public getHistoryActions() {
    return this.history?.getAllActions() ?? []
  }

  // Debug access to history
  public get historyDebug() {
    return this.history
  }
}
