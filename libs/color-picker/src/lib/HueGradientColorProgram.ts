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
  constructor(gl: WebGL2RenderingContext) {
    const program = HueGradientColorProgram.createProgramStatic(gl)
    const programInfo = HueGradientColorProgram.createProgramInfoStatic(gl, program)
    super(programInfo, "aPosition", "uResolution")
  }

  protected static createProgramStatic(gl: WebGL2RenderingContext): WebGLProgram {
    return WebGLProgramBuilder.create(gl, vertexSource, fragmentSource)
  }

  protected createProgram(gl: WebGL2RenderingContext): WebGLProgram {
    return HueGradientColorProgram.createProgramStatic(gl)
  }

  protected static createProgramInfoStatic(gl: WebGL2RenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(gl, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGL2RenderingContext, program: WebGLProgram) {
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
