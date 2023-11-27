import { VectorArray, WebGLProgramBuilder } from "@libs/shared"
import { Color, BaseProgram } from "@libs/shared"
import sourceMap from "./shaders/sourceMap"

export class LineDrawingProgram extends BaseProgram {
  constructor(
    public readonly gl: WebGLRenderingContext,
    public pixelDensity = 1,
  ) {
    super(WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, "lines.vertex", "lines.fragment"))
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

  public setColor(color: Color): typeof this {
    this.gl.uniform4fv(this.getUniformLocation("uColor"), color.vec4)
    return this
  }

  protected getUniformLocation(name: string) {
    const uniformLocation = this.gl.getUniformLocation(this.program, name)
    if (!uniformLocation) {
      throw new Error(`Failed to get uniform location. Does the specified program have a '${name}' uniform?`)
    }
    return uniformLocation
  }

  public drawLine(
    points: ReadonlyArray<number>,
    {
      drawType = this.gl.STREAM_DRAW,
      color = Color.BLACK,
      thickness = 10.0,
      // I don't know what these do
      projection = [2.0, 2.0, 2.0, 2.0],
      model = [2.0, 2.0, 2.0, 2.0],
      view = [2.0, 2.0, 2.0, 2.0],
    }: DrawLineOptions = {},
  ) {
    this.setColor(color)
    this.gl.uniform1f(this.getUniformLocation("uThickness"), thickness)
    this.gl.uniform4fv(this.getUniformLocation("uProjection"), projection)
    this.gl.uniform4fv(this.getUniformLocation("uModel"), model)
    this.gl.uniform4fv(this.getUniformLocation("uView"), view)

    this.setPositionAttr(points, drawType)
    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, points.length / 2)
    this.checkError()
  }

  protected setPositionAttr(points: ReadonlyArray<number>, drawType: DrawType): void {
    this.bufferAttribute("aPosition", new Float32Array(points), drawType, 2)
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
  projection?: VectorArray<4>
  model?: VectorArray<4>
  view?: VectorArray<4>
}

export enum DrawType {
  STATIC_DRAW = WebGLRenderingContext.STATIC_DRAW,
  DYNAMIC_DRAW = WebGLRenderingContext.DYNAMIC_DRAW,
  STREAM_DRAW = WebGLRenderingContext.STREAM_DRAW,
}

export enum LineMode {
  LINE_STRIP = WebGLRenderingContext.LINE_STRIP,
  LINE_LOOP = WebGLRenderingContext.LINE_LOOP,
  LINES = WebGLRenderingContext.LINES,
}
