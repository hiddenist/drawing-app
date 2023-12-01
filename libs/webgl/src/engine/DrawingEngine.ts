import { debug } from "console"
import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { TextureDrawingProgram } from "../programs/TextureDrawingProgram"
import { ActiveProgramSwitcher } from "./ActiveProgramSwitcher"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"

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

  constructor(
    protected savedDrawingLayer: WebGLRenderingContext,
    protected activeDrawingLayer: WebGLRenderingContext,
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

    this.programs = new ActiveProgramSwitcher({
      lineDrawing: new LineDrawingProgram(savedDrawingLayer, this.state.pixelDensity),
      textureDrawing: new TextureDrawingProgram(savedDrawingLayer, this.state.pixelDensity),
    })

    this.drawingHistory = []

    if (!savedDrawingLayer.getContextAttributes()?.preserveDrawingBuffer) {
      console.warn("drawing buffer preservation is disabled on the base rendering layer")
    }

    if (activeDrawingLayer.getContextAttributes()?.preserveDrawingBuffer) {
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

  public setColor(color: Color) {
    this.state.color = color
  }

  public get lineWeight(): number {
    return this.state.lineWeight
  }

  public setLineWeight(weight: number): typeof this {
    this.state.lineWeight = weight
    return this
  }

  public getCurrentColor() {
    return this.state.color
  }

  public clearCanvas() {
    this.clear(this.savedDrawingLayer)
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
    if (pressed) {
      this.state.isDrawing = true
      this.addPosition(position)
      this.updateDrawing()
    } else {
      this.commitPath()
      this.state.isDrawing = false
    }
  }

  public updateDrawing() {
    if (this.state.currentPath.length > 0) {
      this.drawLine(this.activeDrawingLayer, this.state.currentPath, DrawType.STATIC_DRAW)
    }
  }

  public drawLine(gl: WebGLRenderingContext, points: ReadonlyArray<number>, drawType?: DrawLineOptions["drawType"]) {
    //this.getProgram("textureDrawing", gl).prepareFrameBuffer()
    const options = this.getLineOptions()
    this.getProgram("lineDrawing", gl).draw(points, {
      drawType,
      ...options,
    })
    //this.getProgram("textureDrawing", gl).drawFrameBufferToTexture()
  }

  protected commitPath() {
    const path = this.clearCurrentPath()
    if (path.length === 0) {
      return
    }
    debugger
    this.drawLine(this.savedDrawingLayer, path, DrawType.STATIC_DRAW)
    this.drawingHistory.push({
      path,
      options: this.getLineOptions(),
    })
  }

  private clearCurrentPath() {
    const copy = [...this.state.currentPath]
    this.state.currentPath = []
    return copy
  }

  public addPosition(position: Readonly<Vec2>) {
    if (this.state.isDrawing) {
      this.state.currentPath.push(...position)
    }
    this.updateDrawing()
  }
}
