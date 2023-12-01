import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
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
  path: ReadonlyArray<number>
  options: Required<Omit<DrawLineOptions, "drawType">>
}

interface DrawingState {
  color: Color
  currentPath: number[]
  lineWeight: number
  isDrawing: boolean
  pixelDensity: number
  width: number
  height: number
}

export interface DrawingEngineOptions {
  width: number
  height: number
  pixelDensity?: number
}

export class DrawingEngine {
  protected state: DrawingState
  protected programs: ActiveProgramSwitcher<AvailablePrograms>
  protected drawingHistory: Array<HistoryItem>
  protected savedDrawingLayer: Layer
  protected activeDrawingLayer: Layer

  constructor(
    savedDrawingContext: WebGLRenderingContext,
    activeDrawingContext: WebGLRenderingContext,
    options: DrawingEngineOptions,
  ) {
    this.state = {
      ...options,
      color: Color.BLACK,
      currentPath: [],
      lineWeight: 5,
      isDrawing: false,
      pixelDensity: options.pixelDensity ?? 1,
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

  public setColor(color: Color) {
    const opacity = this.state.color.a
    this.state.color = new Color(color.r, color.g, color.b, opacity)
  }

  public setOpacity(opacity: number) {
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

  public setPressed(pressed: boolean, position: Readonly<Vec2>) {
    const path = this.clearCurrentPath()
    if (pressed) {
      this.state.isDrawing = true
      this.addPosition(position)
      this.updateDrawing()
    } else {
      this.commitPath(path)
      this.state.isDrawing = false
    }
  }

  public addPosition(position: Readonly<Vec2>) {
    this.addPositions(position)
  }

  public addPositions(positions: ReadonlyArray<number> | ReadonlyArray<Vec2>) {
    if (this.state.isDrawing) {
      this.state.currentPath.push(...positions.flat())
      this.updateDrawing()
    }
  }

  public updateDrawing() {
    if (this.state.currentPath.length > 0) {
      this.drawLine(this.activeDrawingLayer, this.state.currentPath, DrawType.STATIC_DRAW)
    }
  }

  public drawLine(layer: Layer, points: ReadonlyArray<number>, drawType?: DrawLineOptions["drawType"]) {
    this.getProgram("textureDrawing", layer.gl).prepareTextureForDrawing(layer)
    const options = this.getLineOptions()
    this.getProgram("lineDrawing", layer.gl).draw(points, {
      drawType,
      ...options,
    })
    this.getProgram("textureDrawing", layer.gl).drawTexture(layer)
  }

  protected commitPath(path: ReadonlyArray<number>) {
    if (path.length === 0) {
      return
    }
    this.drawLine(this.savedDrawingLayer, path, DrawType.STATIC_DRAW)
    this.drawingHistory.push({
      path,
      options: this.getLineOptions(),
    })
  }

  private clearCurrentPath() {
    this.clear(this.activeDrawingLayer.gl)
    const copy = [...this.state.currentPath]
    this.state.currentPath = []
    return copy
  }
}
