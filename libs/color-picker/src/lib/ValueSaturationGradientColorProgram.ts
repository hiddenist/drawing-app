import { BaseProgram, Color, WebGLProgramBuilder } from "@libs/shared"
import fragmentSource from "../shaders/value-saturation.fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"
import { BaseGradientColorProgram } from "./BaseGradientColorProgram"

const UNIFORM_NAMES = {
  uResolution: "uResolution",
  uHue: "uHue",
  uSelectedColor: "uSelectedColor",
} as const
const ATTRIBUTE_NAMES = {
  aPosition: "aPosition",
} as const

export class ValueSaturationGradientColorProgram extends BaseGradientColorProgram<
  keyof typeof UNIFORM_NAMES,
  keyof typeof ATTRIBUTE_NAMES
> {
  private hue: number = 0
  private selectedColor?: Color
  constructor(gl: WebGLRenderingContext) {
    const program = ValueSaturationGradientColorProgram.createProgramStatic(gl)
    const programInfo = ValueSaturationGradientColorProgram.createProgramInfoStatic(gl, program)
    super(programInfo, "aPosition", "uResolution")
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.create(gl, vertexSource, fragmentSource)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return ValueSaturationGradientColorProgram.createProgramStatic(gl)
  }

  protected static createProgramInfoStatic(gl: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(gl, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram) {
    return ValueSaturationGradientColorProgram.createProgramInfoStatic(context, program)
  }

  public draw(hue?: number, selectedColor?: Color) {
    if (selectedColor && selectedColor.saturation > 0) {
      this.hue = selectedColor.hue
    } else if (hue !== undefined) {
      this.hue = hue
    }
    this.selectedColor = selectedColor

    super.draw()
  }

  protected setUniforms() {
    this.gl.uniform1f(this.getUniformLocation("uHue"), this.hue)
    this.gl.uniform3fv(this.getUniformLocation("uSelectedColor"), this.selectedColor?.vec3 ?? [-1, -1, -1])
  }

  public setHue(hue: number) {
    this.hue = (hue + 360) % 360
  }

  public getHue() {
    return this.hue
  }
}
