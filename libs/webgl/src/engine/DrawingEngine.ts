import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { ActiveProgramSwitcher } from "./ActiveProgramSwitcher"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
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
}

export class DrawingEngine {
  protected state: DrawingState
  protected programs: ActiveProgramSwitcher<AvailablePrograms>
  protected drawingHistory: Array<HistoryItem>

  constructor(
    protected baseLayer: WebGLRenderingContext,
    protected activeDrawingLayer: WebGLRenderingContext,
    pixelDensity = 1,
  ) {
    this.state = {
      color: Color.BLACK,
      currentPath: [],
      lineWeight: 5,
      isDrawing: false,
      pixelDensity,
    }

    this.programs = new ActiveProgramSwitcher({
      lineDrawing: new LineDrawingProgram(baseLayer, pixelDensity),
    })

    this.drawingHistory = []

    if (!baseLayer.getContextAttributes()?.preserveDrawingBuffer) {
      console.warn("drawing buffer preservation is disabled on the base rendering layer")
    }

    if (activeDrawingLayer.getContextAttributes()?.preserveDrawingBuffer) {
      console.warn("drawing buffer preservation is enabled on the active drawing layer")
    }
  }

  protected getProgram<T extends keyof AvailablePrograms>(name: T): AvailablePrograms[T] {
    return this.programs.getProgram(name)
  }

  public updateDrawing() {
    if (this.state.currentPath.length > 0) {
      this.drawLine(this.state.currentPath, { drawType: DrawType.DYNAMIC_DRAW, thickness: this.lineWeight })
    }
  }

  public drawLine(
    points: ReadonlyArray<number>,
    { color = this.state.color, thickness = this.lineWeight, drawType }: Partial<DrawLineOptions> = {},
  ) {
    this.getProgram("lineDrawing").drawLine(points, {
      drawType,
      thickness: thickness * this.state.pixelDensity,
      color,
    })
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
    this.clear(this.baseLayer)
  }

  // Maybe the rendering contexts should have a wrapper class that handles this?
  protected clear(context: WebGLRenderingContext) {
    context.clearColor(0, 0, 0, 0)
    context.clear(context.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: Readonly<Vec2>) {
    this.state.isDrawing = pressed
    if (pressed) {
      this.getProgram("lineDrawing").gl = this.activeDrawingLayer
      this.addPosition(position)
      this.updateDrawing()
    } else {
      this.clear(this.activeDrawingLayer)
      this.getProgram("lineDrawing").gl = this.baseLayer
      this.commitPath()
    }
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

  protected commitPath() {
    const path = this.clearCurrentPath()
    if (path.length === 0) {
      return
    }
    const options = {
      color: this.state.color,
      thickness: this.lineWeight,
    }
    this.drawLine(path, { drawType: DrawType.STATIC_DRAW, ...options })
    this.drawingHistory.push({
      path,
      options,
    })
  }
}
