import { LineDrawingProgram, DrawLineOptions, DrawType, LineInfo } from "../programs/LineDrawingProgram"
import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import { ActiveProgramSwitcher } from "./ActiveProgramSwitcher"
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
  protected programs: ActiveProgramSwitcher<AvailablePrograms>
  protected drawingHistory: Array<HistoryItem>
  protected savedDrawingLayer: Layer
  protected activeDrawingLayer: Layer

  private drawListeners: Array<DrawListenerCallback> = []

  constructor(
    savedDrawingContext: WebGLRenderingContext,
    activeDrawingContext: WebGLRenderingContext,
    options: DrawingEngineOptions,
  ) {
    this.state = {
      ...options,
      color: Color.BLACK,
      currentPath: { points: [] },
      lineWeight: 20,
      isDrawing: false,
      pixelDensity: options.pixelDensity ?? 1,
      tool: Tools.pressureSensitiveBrush,
    }

    this.savedDrawingLayer = new Layer(savedDrawingContext, ({ gl }) => {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    })
    this.activeDrawingLayer = new Layer(activeDrawingContext, ({ gl }) => {
      gl.disable(gl.BLEND)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    })

    this.programs = new ActiveProgramSwitcher({
      lineDrawing: new LineDrawingProgram(savedDrawingContext, this.state.pixelDensity),
      textureDrawing: new TextureDrawingProgram(savedDrawingContext, this.state.pixelDensity),
    })

    this.drawingHistory = []

    if (!savedDrawingContext.getContextAttributes()?.preserveDrawingBuffer) {
      console.warn("drawing buffer preservation is disabled on the base rendering layer")
    }

    if (activeDrawingContext.getContextAttributes()?.preserveDrawingBuffer) {
      console.warn("drawing buffer preservation is enabled on the active drawing layer")
    }
  }

  protected get pixelDensity() {
    return this.state.pixelDensity
  }

  protected set pixelDensity(pixelDensity: number) {
    this.state.pixelDensity = pixelDensity
  }

  protected getProgram<T extends keyof AvailablePrograms>(
    name: T,
    context?: WebGLRenderingContext,
  ): AvailablePrograms[T] {
    const program = this.programs.getProgram(name)
    if (context) {
      program.useContext(context)
    }
    return program
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
    const opacity = this.state.color.a
    this.state.color = new Color(color.r, color.g, color.b, opacity)
  }

  public setOpacity(opacity: number) {
    this.commitPath()
    const color = this.state.color
    this.state.color = new Color(color.r, color.g, color.b, opacity)
  }

  public getOpacity() {
    return this.state.color.a
  }

  public get lineWeight(): number {
    return this.state.lineWeight
  }

  public setLineWeight(weight: number): typeof this {
    this.state.lineWeight = weight
    return this
  }

  public clearCanvas() {
    this.clear(this.savedDrawingLayer.gl)
  }

  protected getLineOptions(): Required<Omit<DrawLineOptions, "drawType">> {
    return {
      color: this.state.color,
      thickness: this.lineWeight,
    }
  }

  // Maybe the rendering contexts should have a wrapper class that handles this?
  protected clear(context: WebGLRenderingContext) {
    context.clearColor(0, 0, 0, 0)
    context.clear(context.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: Readonly<Vec2>, pressure: [number]) {
    if (pressed) {
      this.state.isDrawing = true
      this.addPosition(position, pressure)
      this.updateDrawing()
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
      this.updateDrawing()
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

  public updateDrawing() {
    if (this.state.currentPath.points.length > 0) {
      this.drawLine(this.activeDrawingLayer, this.state.currentPath, DrawType.STATIC_DRAW)
    }
  }

  public drawLine(layer: Layer, path: LineInfo, drawType?: DrawLineOptions["drawType"]) {
    this.getProgram("textureDrawing", layer.gl).prepareTextureForDrawing(layer)
    const options = this.getLineOptions()
    this.getProgram("lineDrawing", layer.gl).draw(path, {
      drawType,
      ...options,
    })
    this.getProgram("textureDrawing", layer.gl).drawTexture(layer)
    this.callDrawListeners({ path, options, tool: this.state.tool })
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
    const doDraw = () => {
      this.drawLine(this.savedDrawingLayer, path, DrawType.STATIC_DRAW)
    }
    this.drawingHistory.push({
      path,
      options: this.getLineOptions(),
      tool: this.state.tool,
    })
    doDraw()

    // the first draw seems to disappear without this. ‾\_(:/)_/‾
    if (this.drawingHistory.length === 1) {
      console.debug("redrawing first draw as a hacky bug fix")
      requestAnimationFrame(doDraw)
      return
    }
  }

  private clearCurrentPath(): Readonly<LineInfo> {
    this.clear(this.activeDrawingLayer.gl)
    const copy = this.state.currentPath
    this.state.currentPath = { points: [] }
    return copy
  }
}
