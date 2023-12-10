import { WebGLProgramBuilder } from "@libs/shared"
import { Color, BaseProgram } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "../shaders/sourceMap"

const VERTEX_SHADER = "position.vertex"
const FRAGMENT_SHADER = "color.fragment"
const UNIFORM_NAMES = { ...uniformNames[VERTEX_SHADER], ...uniformNames[FRAGMENT_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export abstract class PositionColorProgramBase extends BaseProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(
      PositionColorProgramBase.createContextStatic(gl, PositionColorProgramBase.createProgramStatic(gl)),
      pixelDensity,
    )
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return PositionColorProgramBase.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram) {
    return PositionColorProgramBase.createContextStatic(context, program)
  }

  protected setColor(color: Color): typeof this {
    this.gl.uniform3fv(this.getUniformLocation("color"), color.vec3)
    return this
  }

  protected setOpacity(opacity: number): typeof this {
    this.gl.uniform1f(this.getUniformLocation("opacity"), opacity)
    return this
  }

  public drawPosition(
    points: ReadonlyArray<number>,
    { drawType = DrawType.STREAM_DRAW, drawMode }: DrawPositionOptions,
  ) {
    this.bufferAttribute("position", new Float32Array(points), { usage: drawType, size: 2 })
    this.gl.drawArrays(drawMode, 0, points.length / 2)
    this.checkError()
  }
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

export interface DrawPositionOptions {
  drawType?: DrawType
  drawMode: DrawMode
}
