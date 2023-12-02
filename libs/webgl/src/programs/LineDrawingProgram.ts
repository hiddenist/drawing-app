import { SimpleShaderProgram, DrawType, DrawMode } from "./abstract/SimpleShaderProgram"
import { Color } from "@libs/shared"

export { DrawType } from "./abstract/SimpleShaderProgram"

export interface LineInfo {
  points: number[]
  pressure?: number[]
}

export class LineDrawingProgram extends SimpleShaderProgram {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(gl, pixelDensity)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    this.gl.uniform2f(this.getUniformLocation("canvasSize"), this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  protected setColor(color: Color): typeof this {
    this.gl.uniform4fv(this.getUniformLocation("color"), color.vec4)
    return this
  }

  public draw(
    { points, pressure }: Readonly<LineInfo>,
    { drawType = this.gl.STREAM_DRAW, color = Color.BLACK, thickness = 5.0 }: DrawLineOptions = {},
    context = this.currentContext,
  ) {
    this.setColor(color)

    const doublePoints = []

    if (pressure && pressure.length !== points.length / 2) {
      console.warn("Pressure array should be the same length as the points array")
    }

    const hasPressureData = (pressure?.filter((p) => p > 0).length ?? 0) > 1

    for (let i = 0; i < points.length - 2; i += 2) {
      const pressureValue = pressure && hasPressureData ? pressure[i / 2] : 1.0
      const adjustedThickness = Math.max(thickness * pressureValue, 1) * this.pixelDensity
      const x1 = points[i]
      const y1 = points[i + 1]
      const x2 = points[i + 2]
      const y2 = points[i + 3]

      const angle = Math.atan2(y2 - y1, x2 - x1)
      const offsetX = (Math.sin(angle) * adjustedThickness) / 2
      const offsetY = (Math.cos(angle) * adjustedThickness) / 2

      doublePoints.push(x1 - offsetX, y1 + offsetY)
      doublePoints.push(x1 + offsetX, y1 - offsetY)
    }

    this.drawPosition(doublePoints, { drawType, drawMode: DrawMode.TRIANGLE_STRIP }, context)
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
