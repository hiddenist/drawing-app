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

  public updateDrawing(currentSegment: number[]) {
    if (currentSegment.length > 0) {
      this.drawLineSegment(currentSegment)
    }
  }

  private drawLineSegment(segment: number[]) {
    const gl = this.gl
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(segment), gl.DYNAMIC_DRAW)

    const position = gl.getAttribLocation(this.programs.lineDrawing.program, "position")
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(gl.LINE_STRIP, 0, segment.length / 2)
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
