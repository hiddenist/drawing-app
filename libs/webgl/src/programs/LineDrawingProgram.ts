import { WebGLProgramBuilder } from "@libs/shared"
import { Color, BaseProgram } from "@libs/shared"
import sourceMap from "./shaders/sourceMap"

export class LineDrawingProgram extends BaseProgram {
  constructor(
    gl: WebGLRenderingContext,
    public pixelDensity = 1,
  ) {
    super(gl)
  }

  protected createProgram(): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(this.gl, sourceMap, "position.vertex", "color.fragment")
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const canvasSize = this.gl.getUniformLocation(this.program, "uCanvasSize")
    this.gl.uniform2f(canvasSize, this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public getCanvasSize(): { width: number; height: number } {
    const size = super.getCanvasSize()
    return { width: size.width * this.pixelDensity, height: size.height * this.pixelDensity }
  }

  protected setColor(color: Color): typeof this {
    this.gl.uniform4fv(this.getUniformLocation("uColor"), color.vec4)
    return this
  }

  public drawLine(
    points: ReadonlyArray<number>,
    { drawType = this.gl.STREAM_DRAW, color = Color.BLACK, thickness = 5.0 }: DrawLineOptions = {},
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

    this.bufferAttribute("aPosition", new Float32Array(doublePoints), drawType, 2)
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, doublePoints.length / 2)
    this.checkError()
  }

  protected getUniformLocation(
    name: string,
    { gl = this.gl, program = this.program }: { gl?: WebGLRenderingContext; program?: WebGLProgram } = {},
  ): WebGLUniformLocation {
    const uniformLocation = gl.getUniformLocation(program, name)
    if (!uniformLocation) {
      throw new Error(`Failed to get uniform location. Does the specified program have a '${name}' uniform?`)
    }
    return uniformLocation
  }

  protected bufferAttribute(attrName: string, data: Readonly<Float32Array>, drawType: DrawType, size: number): void {
    this.createBuffer()
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, drawType)
    const attr = this.gl.getAttribLocation(this.program, attrName)
    this.gl.enableVertexAttribArray(attr)
    this.gl.vertexAttribPointer(attr, size, this.gl.FLOAT, false, 0, 0)
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
