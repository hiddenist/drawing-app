import { LineDrawingProgram, DrawLineOptions, DrawType, LineInfo } from "../programs/LineDrawingProgram"
import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"
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
  isDrawing: boolean
  pixelDensity: number
  width: number
  height: number
  tool: Tool
}

export interface DrawingEngineOptions {
  width: number
  height: number
  pixelDensity?: number
}

type DrawListenerCallback = (action: HistoryItem) => void

export const Tools = {
  brush: "brush",
  // todo: eraser: "eraser",
  pressureSensitiveBrush: "pressureSensitiveBrush",
} as const

export type Tool = (typeof Tools)[keyof typeof Tools]

export class DrawingEngine {
  protected state: DrawingState
  protected programs: AvailablePrograms
  protected drawingHistory: Array<HistoryItem>
  protected savedDrawingLayer: Layer
  protected activePathLayer: Layer

  private drawListeners: Array<DrawListenerCallback> = []

  constructor(
    public gl: WebGLRenderingContext,
    options: DrawingEngineOptions,
  ) {
    this.state = {
      ...options,
      color: Color.BLACK,
      opacity: 255,
      currentPath: { points: [] },
      lineWeight: 20,
      isDrawing: false,
      pixelDensity: options.pixelDensity ?? 1,
      tool: Tools.pressureSensitiveBrush,
    }

    this.savedDrawingLayer = new Layer(gl)
    this.activePathLayer = new Layer(gl, { clearBeforeDrawing: true })

    this.programs = {
      lineDrawing: new LineDrawingProgram(gl, this.state.pixelDensity),
      textureDrawing: new TextureDrawingProgram(gl, this.state.pixelDensity),
    }

    this.drawingHistory = []
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

  public setTool(tool: Tool) {
    this.commitPath()
    this.state.tool = tool
  }

  public setColor(color: Color) {
    this.commitPath()
    this.state.color = color
  }

  public setOpacity(opacity: number) {
    this.commitPath()
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
    this.activePathLayer.clear()
    this.clearCurrent()
    this.programs.textureDrawing.draw(this.activePathLayer, this.savedDrawingLayer)
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

      hardness: 0.5,
      flow: 1.0,
    }
  }

  public setPressed(pressed: boolean, position: Readonly<Vec2>, pressure: [number]) {
    if (pressed) {
      this.state.isDrawing = true
      this.addPosition(position, pressure)
    } else {
      this.commitPath()
    }
  }

  public addPosition(position: Readonly<Vec2>, pressure: [number]) {
    this.addPositions([[...position]], pressure)
  }

  public addPositions(positions: ReadonlyArray<Vec2>, pressure: ReadonlyArray<number>) {
    if (this.state.isDrawing) {
      this.state.currentPath.points.push(...positions.flat())
      if (pressure) this.addPressure(pressure)
      this.updateActivePath()
    }
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
      this.drawLine(this.activePathLayer, this.state.currentPath, DrawType.STATIC_DRAW)
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
    this.callDrawListeners({ path, options, tool: this.state.tool })
  }

  protected render() {
    this.programs.textureDrawing.draw(this.activePathLayer, this.savedDrawingLayer)
  }

  public addDrawListener(cb: DrawListenerCallback) {
    this.drawListeners.push(cb)
    return this
  }

  public removeDrawListener(cb: DrawListenerCallback) {
    this.drawListeners = this.drawListeners.filter((listener) => listener !== cb)
    return this
  }

  protected callDrawListeners(historyItem: HistoryItem) {
    this.drawListeners.forEach((listener) => listener(historyItem))
  }

  protected commitPath() {
    const path = this.clearCurrentPath()
    this.state.isDrawing = false
    if (path.points.length === 0) {
      return
    }

    const copy = this.programs.textureDrawing.mergeDown(this.activePathLayer, this.savedDrawingLayer)
    this.savedDrawingLayer.clear()
    this.activePathLayer.clear()
    this.savedDrawingLayer = copy
    this.render()
    this.drawingHistory.push({
      path,
      options: this.getLineOptions(),
      tool: this.state.tool,
    })
  }

  private clearCurrentPath(): Readonly<LineInfo> {
    const copy = this.state.currentPath
    this.state.currentPath = { points: [] }
    return copy
  }
}
