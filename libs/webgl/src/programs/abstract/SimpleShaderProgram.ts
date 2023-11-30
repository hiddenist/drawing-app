import { WebGLProgramBuilder } from "@libs/shared"
import { BaseProgram } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "../shaders/sourceMap"

const VERTEX_SHADER = "position.vertex"
const FRAGMENT_SHADER = "color.fragment"
const UNIFORM_NAMES = { ...uniformNames[VERTEX_SHADER], ...uniformNames[FRAGMENT_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export abstract class SimpleShaderProgram extends BaseProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  constructor(gl: WebGLRenderingContext) {
    super(SimpleShaderProgram.createContextStatic(gl, SimpleShaderProgram.createProgramStatic(gl)))
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return SimpleShaderProgram.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.makeBaseContextFromAttributes(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createContext(context: WebGLRenderingContext, program: WebGLProgram) {
    return SimpleShaderProgram.createContextStatic(context, program)
  }
}
