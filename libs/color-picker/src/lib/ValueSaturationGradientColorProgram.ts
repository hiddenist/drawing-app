import { BaseProgram, WebGLProgramBuilder } from "@libs/shared"
import fragmentSource from "../shaders/value-saturation.fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"
import { BaseGradientColorProgram } from "./BaseGradientColorProgram"

const UNIFORM_NAMES = {
  uResolution: "uResolution",
  uHue: "uHue",
} as const
const ATTRIBUTE_NAMES = {
  aPosition: "aPosition",
} as const

export class ValueSaturationGradientColorProgram extends BaseGradientColorProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  private hue: number = 0
  constructor(gl: WebGLRenderingContext) {
    super(
      ValueSaturationGradientColorProgram.createContextStatic(
        gl,
        ValueSaturationGradientColorProgram.createProgramStatic(gl),
      ),
      "aPosition",
      "uResolution",
    )
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.create(gl, vertexSource, fragmentSource)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return ValueSaturationGradientColorProgram.createProgramStatic(gl)
  }

  protected static createContextStatic(gl: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.makeBaseContextFromAttributes(gl, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createContext(context: WebGLRenderingContext, program: WebGLProgram) {
    return ValueSaturationGradientColorProgram.createContextStatic(context, program)
  }

  public draw(hue?: number) {
    if (hue !== undefined) this.hue = hue
    super.draw()
  }

  protected setUniforms() {
    this.gl.uniform1f(this.getUniformLocation("uHue"), this.hue)
  }

  public setHue(hue: number) {
    this.hue = (hue + 360) % 360
  }

  public getHue() {
    return this.hue
  }
}
