import { ColorContext } from "./ColorContext"
import { LineDrawingProgram } from "../programs/LineDrawingProgram"
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

  public drawLine(points: number[]) {
    this.switchProgram("lineDrawing").drawLine(points, this.color.foreground)
  }

  public get color(): ColorContext {
    return this.context.color
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }
}
