import { WebGLProgramBuilder } from "@libs/shared"
import { BaseProgram } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "../shaders/sourceMap"

const VERTEX_SHADER = "texture.vertex"
const FRAGMENT_SHADER = "texture.fragment"
const UNIFORM_NAMES = { ...uniformNames[FRAGMENT_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export abstract class SimpleTextureProgram extends BaseProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(SimpleTextureProgram.createContextStatic(gl, SimpleTextureProgram.createProgramStatic(gl)), pixelDensity)
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return SimpleTextureProgram.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram) {
    return SimpleTextureProgram.createContextStatic(context, program)
  }

  protected createFrameBuffer(gl: WebGLRenderingContext) {
    const frameBuffer = gl.createFramebuffer()
    if (!frameBuffer) {
      throw new Error("Could not create framebuffer")
    }
    return frameBuffer
  }
}
