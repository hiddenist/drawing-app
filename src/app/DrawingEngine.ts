import { ColorContext } from "./ColorContext"
import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { BaseDrawingEngine } from "./BaseDrawingEngine"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
}

export class DrawingEngine extends BaseDrawingEngine<AvailablePrograms> {
  protected programs: AvailablePrograms
  protected context = {
    color: new ColorContext(),
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
}
