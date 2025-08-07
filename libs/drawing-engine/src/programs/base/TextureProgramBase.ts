import { WebGLProgramBuilder } from "@libs/shared"
import { BaseProgram } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "../shaders/sourceMap"

const VERTEX_SHADER = "texture.vertex"
const FRAGMENT_SHADER = "texture.fragment"
const UNIFORM_NAMES = { ...uniformNames[FRAGMENT_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export abstract class TextureProgramBase extends BaseProgram<keyof typeof UNIFORM_NAMES, keyof typeof ATTRIBUTE_NAMES> {
  constructor(gl: WebGL2RenderingContext, pixelDensity: number) {
    super(TextureProgramBase.createContextStatic(gl, TextureProgramBase.createProgramStatic(gl)), pixelDensity)
  }

  protected static createProgramStatic(gl: WebGL2RenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGL2RenderingContext): WebGLProgram {
    return TextureProgramBase.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGL2RenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGL2RenderingContext, program: WebGLProgram) {
    return TextureProgramBase.createContextStatic(context, program)
  }
}
