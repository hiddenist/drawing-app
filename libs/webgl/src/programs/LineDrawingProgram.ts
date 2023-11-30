import { SimpleShaderProgram } from "./abstract/SimpleShaderProgram"
import { Color } from "@libs/shared"

export class LineDrawingProgram extends SimpleShaderProgram {
  constructor(
    gl: WebGLRenderingContext,
    public pixelDensity = 1,
  ) {
    super(gl)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    this.gl.uniform2f(this.getUniformLocation("canvasSize"), this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public getCanvasSize(): { width: number; height: number } {
    const size = super.getCanvasSize()
    return { width: size.width * this.pixelDensity, height: size.height * this.pixelDensity }
  }

  protected setColor(color: Color): typeof this {
    this.gl.uniform4fv(this.getUniformLocation("color"), color.vec4)
    return this
  }

  public drawLine(
    points: ReadonlyArray<number>,
    { drawType = this.gl.STREAM_DRAW, color = Color.BLACK, thickness = 5.0 }: DrawLineOptions = {},
    context = this.currentContext,
  ) {
    this.setColor(color)

    const doublePoints = []

    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i]
      const y1 = points[i + 1]
      const x2 = points[i + 2]
      const y2 = points[i + 3]

      const angle = Math.atan2(y2 - y1, x2 - x1)
      const offsetX = (Math.sin(angle) * thickness) / 2
      const offsetY = (Math.cos(angle) * thickness) / 2

      doublePoints.push(x1 - offsetX, y1 + offsetY)
      doublePoints.push(x1 + offsetX, y1 - offsetY)
    }

    this.bufferAttribute("position", new Float32Array(doublePoints), { usage: drawType, size: 2 })
    context.gl.drawArrays(context.gl.TRIANGLE_STRIP, 0, doublePoints.length / 2)
    this.checkError()
  }
}

export interface DrawLineOptions {
  /**
   * The draw type to use when drawing the line. Defaults to `gl.STREAM_DRAW`.
   */
  drawType?: DrawType
  /*
   * The color to use when drawing the line. Black if not specified.
   */
  color?: Color

  thickness?: number
}

export enum DrawType {
  STATIC_DRAW = WebGLRenderingContext.STATIC_DRAW,
  DYNAMIC_DRAW = WebGLRenderingContext.DYNAMIC_DRAW,
  STREAM_DRAW = WebGLRenderingContext.STREAM_DRAW,
}

export enum DrawMode {
  LINE_STRIP = WebGLRenderingContext.LINE_STRIP,
  LINE_LOOP = WebGLRenderingContext.LINE_LOOP,
  LINES = WebGLRenderingContext.LINES,
  TRIANGLE_STRIP = WebGLRenderingContext.TRIANGLE_STRIP,
  TRIANGLE_FAN = WebGLRenderingContext.TRIANGLE_FAN,
  TRIANGLES = WebGLRenderingContext.TRIANGLES,
}
