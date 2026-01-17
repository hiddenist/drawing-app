import { BaseProgram, WebGLProgramBuilder } from "@libs/shared"
import fragmentSource from "../shaders/hues.fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"
import { BaseGradientColorProgram } from "./BaseGradientColorProgram"

const UNIFORM_NAMES = {
  uResolution: "uResolution",
  uSaturation: "uSaturation",
} as const
const ATTRIBUTE_NAMES = {
  aPosition: "aPosition",
} as const

export class HueGradientColorProgram extends BaseGradientColorProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  private saturation: number = 100
  constructor(gl: WebGLRenderingContext) {
    const program = HueGradientColorProgram.createProgramStatic(gl)
    const programInfo = HueGradientColorProgram.createProgramInfoStatic(gl, program)
    super(programInfo, "aPosition", "uResolution")
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.create(gl, vertexSource, fragmentSource)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return HueGradientColorProgram.createProgramStatic(gl)
  }

  protected static createProgramInfoStatic(gl: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(gl, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram) {
    return HueGradientColorProgram.createProgramInfoStatic(context, program)
  }

  public draw(saturation?: number) {
    if (saturation !== undefined) this.saturation = saturation
    super.draw()
  }

  protected setUniforms() {
    this.gl.uniform1f(this.getUniformLocation("uSaturation"), this.saturation)
  }

  public setSaturation(saturation: number) {
    this.saturation = saturation
  }
}
