import { ColorContext } from "./ColorContext"
import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { BaseDrawingEngine } from "./BaseDrawingEngine"
import { LineContext } from "./LineContext"
import { VectorArray } from "../types/arrays"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
}

export class DrawingEngine extends BaseDrawingEngine<AvailablePrograms> {
  protected programs: AvailablePrograms
  protected context = {
    color: new ColorContext(),
    line: new LineContext(),
    isDrawing: false,
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
    this.programs = {
      lineDrawing: new LineDrawingProgram(this.gl),
    }
  }

  public updateDrawing(currentSegment: number[]) {
    if (currentSegment.length > 0) {
      this.drawLine(currentSegment, { drawType: DrawType.DYNAMIC_DRAW })
    }
  }

  public drawLine(points: number[], options?: DrawLineOptions) {
    this.switchProgram("lineDrawing").drawLine(points, this.color.foreground, options)
  }

  public get color(): ColorContext {
    return this.context.color
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: VectorArray<2>) {
    this.context.isDrawing = pressed
    if (pressed) {
      this.context.line.addPoint(position)
      this.updateDrawing(this.context.line.flat)
    } else {
      this.commitDrawing()
      this.context.line.clearCurrentSegment()
    }
  }

  protected commitDrawing() {
    if (this.context.line.currentSegment.length > 0) {
      this.drawLine(this.context.line.flat, { drawType: DrawType.STATIC_DRAW })
      // todo: add to a history context
      // todo: copy to a persistent canvas
    }
  }

  public setPosition(position: VectorArray<2>) {
    if (this.context.isDrawing) {
      // todo: remove line segments that are outside the canvas
      this.context.line.addPoint(position)
      this.updateDrawing(this.context.line.flat)
    }
  }
}
