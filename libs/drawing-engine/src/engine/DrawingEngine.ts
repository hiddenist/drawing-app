import { LineDrawingProgram, DrawLineOptions, DrawType, LineInfo } from "../programs/LineDrawingProgram"
import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import type { Vec2 } from "@libs/shared"
import { BaseProgram, Color } from "@libs/shared"
import { Layer } from "./Layer"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
  textureDrawing: TextureDrawingProgram
}

interface HistoryItem {
  path: Readonly<LineInfo>
  tool: Tool
  options: Required<Omit<DrawLineOptions, "drawType">>
}

interface DrawingState {
  color: Color
  opacity: number
  currentPath: LineInfo
  lineWeight: number
  isPressed: boolean
  pixelDensity: number
  width: number
  height: number
  tool: Tool
  prevTool: Tool
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
  changeTool: { tool: Tool }
}
export type DrawingEngineEvent<T extends DrawingEngineEventName> = {
  eventName: T
} & (DrawingEngineEventMap[T] extends undefined ? {} : DrawingEngineEventMap[T])
export type DrawingEngineEventName = keyof DrawingEngineEventMap
export type DrawingEventHandler<T extends DrawingEngineEventName> = (event: DrawingEngineEvent<T>) => void

type DrawingEventListeners = {
  [Key in DrawingEngineEventName]: Array<DrawingEventHandler<Key>>
}

export const Tools = {
  brush: "brush",
  // todo: eraser: "eraser",
  pressureSensitiveBrush: "pressureSensitiveBrush",
  eyedropper: "eyedropper",
} as const

const defaultTool = Tools.pressureSensitiveBrush

export type Tool = (typeof Tools)[keyof typeof Tools]

export interface ToolBindings {
  onPress?: (position: Readonly<Vec2>, pressure: Readonly<[number]>) => { hideCursor?: boolean } | void
  onMove?: (positions: ReadonlyArray<Vec2>, pressure: ReadonlyArray<number>) => void
  onRelease?: (position: Readonly<Vec2>, pressure: Readonly<[number]>) => void
  onCancel?: () => void
  onCommit?: () => void
}

export class DrawingEngine {
  protected state: DrawingState
  protected programs: AvailablePrograms
  protected drawingHistory: Array<HistoryItem>
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

  protected tools: Record<Tool, ToolBindings>

  private listeners: Partial<DrawingEventListeners> = {}

  constructor(
    public gl: WebGLRenderingContext,
    protected readonly options: DrawingEngineOptions,
  ) {
    this.state = {
      ...options,
      color: Color.BLACK,
      opacity: 255,
      currentPath: { points: [] },
      lineWeight: 20,
      isPressed: false,
      pixelDensity: options.pixelDensity ?? 1,
      tool: defaultTool,
      prevTool: defaultTool,
    }

    this.savedDrawingLayer = new Layer(gl)
    this.activeDrawingLayer = new Layer(gl, { clearBeforeDrawing: true })

    this.programs = {
      lineDrawing: new LineDrawingProgram(gl, this.state.pixelDensity),
      textureDrawing: new TextureDrawingProgram(gl, this.state.pixelDensity),
    }

    this.drawingHistory = []

    const brushBindings: ToolBindings = {
      onPress: (position, pressure) => {
        this.addPosition(position, pressure)
        return { hideCursor: true }
      },
      onMove: (positions, pressure) => {
        this.addPositions(positions, pressure)
      },
      onRelease: () => {
        this.commitToSavedLayer()
      },
      onCommit: () => {
        const path = this.clearCurrentPath()

        this.state.isPressed = false
        if (path.points.length === 0) {
          return
        }

        this.drawingHistory.push({
          path,
          tool: this.getCurrentTool(),
          options: this.getLineOptions(),
        })
      },
    }
    this.tools = {
      [Tools.brush]: brushBindings,
      [Tools.pressureSensitiveBrush]: brushBindings,
      [Tools.eyedropper]: {
        onCancel: () => {
          this.setTool(this.state.prevTool ?? defaultTool)
          this.callListeners("previewColor", { color: null })
        },
        onPress: (pos) => {
          this.pickColor(pos)
        },
        onMove: (positions) => {
          const color = BaseProgram.getColorAtPosition(this.gl, positions[positions.length - 1])
          if (!color) {
            return
          }
          this.callListeners("previewColor", { color })
        },
        onRelease: (position) => {
          if (this.pickColor(position)) {
            const prevTool = this.state.prevTool ?? defaultTool
            this.setTool(prevTool === Tools.eyedropper ? defaultTool : prevTool)
          } else {
            this.handleCancel()
          }
        },
      },
    }
  }

  protected get pixelDensity() {
    return this.state.pixelDensity
  }

  protected set pixelDensity(pixelDensity: number) {
    this.state.pixelDensity = pixelDensity
  }

  public getCurrentColor() {
    return this.state.color
  }

  public getCurrentTool() {
    return this.state.tool
  }

  public get activeTool() {
    return this.tools[this.state.tool]
  }

  public setTool(tool: Tool) {
    if (this.state.tool === tool) {
      return
    }
    this.commitToSavedLayer()
    this.state.prevTool = this.state.tool
    this.state.tool = tool
    this.callListeners("changeTool", { tool })
  }

  public setColor(color: Color) {
    this.commitToSavedLayer()
    this.state.color = color
  }

  public setOpacity(opacity: number) {
    this.commitToSavedLayer()
    this.state.opacity = opacity
  }

  public getOpacity() {
    return this.state.opacity
  }

  public get lineWeight(): number {
    return this.state.lineWeight
  }

  public setLineWeight(weight: number): typeof this {
    this.state.lineWeight = weight
    return this
  }

  public clearCanvas() {
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.clearCurrent()
    this.programs.textureDrawing.draw(this.activeDrawingLayer, this.savedDrawingLayer)

    this.callListeners("clear", undefined)
  }

  protected clearCurrent() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  protected getLineOptions(): Required<Omit<DrawLineOptions, "drawType">> {
    return {
      color: this.state.color,
      opacity: this.state.opacity,
      diameter: this.lineWeight,
    }
  }

  protected handlePointerDown(position: Readonly<Vec2>, pressure: Readonly<[number]>) {
    this.state.isPressed = true
    return this.tools[this.state.tool].onPress?.(position, pressure)
  }

  protected handlePointerUp(position: Readonly<Vec2>, pressure: Readonly<[number]>) {
    this.state.isPressed = false
    return this.tools[this.state.tool].onRelease?.(position, pressure)
  }

  protected handlePointerMove(positions: ReadonlyArray<Vec2>, pressure: ReadonlyArray<number>) {
    return this.tools[this.state.tool].onMove?.(positions, pressure)
  }

  protected handleCancel() {
    this.tools[this.state.tool].onCancel?.()
  }

  protected pickColor(position: Readonly<Vec2>) {
    const color = BaseProgram.getColorAtPosition(this.gl, position)
    if (!color) {
      return false
    }
    this.setColor(color)
    this.callListeners("pickColor", { color })
    return true
  }

  public addPosition(position: Readonly<Vec2>, pressure: Readonly<[number]>) {
    this.addPositions([[...position]], pressure)
  }

  public addPositions(positions: ReadonlyArray<Vec2>, pressure: ReadonlyArray<number>) {
    if (this.state.isPressed) {
      this.state.currentPath.points.push(...positions.flat())
      if (pressure) this.addPressure(pressure)
      this.updateActivePath()
    }
  }

  protected isPositionInCanvas(position: Readonly<Vec2>) {
    return position[0] >= 0 && position[0] <= this.state.width && position[1] >= 0 && position[1] <= this.state.height
  }

  private addPressure(pressure: ReadonlyArray<number>) {
    if (this.state.tool !== Tools.pressureSensitiveBrush) {
      return
    }
    if (!this.state.currentPath.pressure) {
      this.state.currentPath.pressure = []
    }
    this.state.currentPath.pressure.push(...pressure)
  }

  protected updateActivePath() {
    if (this.state.currentPath.points.length > 0) {
      this.drawLine(this.activeDrawingLayer, this.state.currentPath, DrawType.STATIC_DRAW)
    }
  }

  public drawLine(layer: Layer, path: LineInfo, drawType?: DrawLineOptions["drawType"]) {
    const options = this.getLineOptions()
    this.programs.textureDrawing.createTextureImage(layer, () => {
      this.programs.lineDrawing.draw(path, {
        drawType,
        ...options,
      })
    })
    this.render()
    this.callListeners("draw", { path, options, tool: this.state.tool })
  }

  public loadImage(image: TexImageSource) {
    const imageLayer = new Layer(this.gl, { ...this.savedDrawingLayer.settings }, image)
    this.savedDrawingLayer = imageLayer
    this.render()
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
    this.programs.textureDrawing.draw(this.activeDrawingLayer, this.savedDrawingLayer)
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
    this.listeners[eventName]?.splice(index, 1)
    return this
  }

  protected callListeners<E extends DrawingEngineEventName>(eventName: E, data: DrawingEngineEventMap[E]) {
    this.listeners[eventName]?.forEach((listener) => listener({ eventName, ...data }))
  }

  protected commitToSavedLayer() {
    const copy = this.programs.textureDrawing.mergeDown(this.activeDrawingLayer, this.savedDrawingLayer)
    this.savedDrawingLayer.clear()
    this.activeDrawingLayer.clear()
    this.savedDrawingLayer = copy
    this.render()

    this.activeTool.onCommit?.()
  }

  private clearCurrentPath(): Readonly<LineInfo> {
    const copy = this.state.currentPath
    this.state.currentPath = { points: [] }
    return copy
  }
}
