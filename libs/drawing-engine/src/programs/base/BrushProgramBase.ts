import { WebGLProgramBuilder } from "@libs/shared"
import { BaseProgram } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "../shaders/sourceMap"

const VERTEX_SHADER = "brush.vertex"
const FRAGMENT_SHADER = "brush.fragment"
const UNIFORM_NAMES = { ...uniformNames[FRAGMENT_SHADER], ...uniformNames[VERTEX_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export abstract class BrushProgramBase extends BaseProgram<keyof typeof UNIFORM_NAMES, keyof typeof ATTRIBUTE_NAMES> {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(BrushProgramBase.createContextStatic(gl, BrushProgramBase.createProgramStatic(gl)), pixelDensity)
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return BrushProgramBase.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram) {
    return BrushProgramBase.createContextStatic(context, program)
  }
}
