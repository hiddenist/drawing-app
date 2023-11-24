import { WebGLProgramBuilder } from "./WebGLProgramBuilder"
import positionVertexSource from "./shaders/position.vertex.glsl"
import fragmentShaderSource from "./shaders/color.fragment.glsl"
import { Color } from "../utils/Color"
import { BaseProgram } from "./BaseProgram"

export class LineDrawingProgram extends BaseProgram {
  constructor(public readonly gl: WebGLRenderingContext) {
    super(WebGLProgramBuilder.create(gl, positionVertexSource, fragmentShaderSource))
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const canvasSize = this.gl.getUniformLocation(this.program, "canvasSize")
    this.gl.uniform2f(canvasSize, this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public setColor(color: Color): LineDrawingProgram {
    const colorLocation = this.gl.getUniformLocation(this.program, "color")
    if (!colorLocation) {
      throw new Error("Failed to get color location. Does the specified program have a 'color' uniform?")
    }
    this.gl.uniform4fv(colorLocation, color.toVector4())
    return this
  }

  public drawLine(
    points: number[],
    color: Color,
    { drawType = this.gl.STREAM_DRAW, lineMode = this.gl.LINE_STRIP }: DrawLineOptions = {},
  ) {
    this.createBuffer()
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), drawType)

    this.setColor(color)

    const position = this.gl.getAttribLocation(this.program, "position")
    this.gl.enableVertexAttribArray(position)
    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0)

    this.gl.drawArrays(lineMode, 0, points.length / 2)

    this.checkError()
  }
}

export interface DrawLineOptions {
  /**
   * The draw type to use when drawing the line. Defaults to `gl.STREAM_DRAW`.
   */
  drawType?: DrawType
  /**
   * The line mode to use when drawing the line. Defaults to `gl.LINE_STRIP`.
   */
  lineMode?: LineMode
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
