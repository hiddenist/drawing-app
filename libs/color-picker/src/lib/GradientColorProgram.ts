import { BaseProgram, WebGLProgramBuilder, Vec2, Color } from "@libs/shared"
import fragmentSource from "../shaders/fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"

const UNIFORM_NAMES = {
  uResolution: "uResolution",
} as const
const ATTRIBUTE_NAMES = {
  aPosition: "aPosition",
} as const

export class GradientColorProgram extends BaseProgram<keyof typeof UNIFORM_NAMES, keyof typeof ATTRIBUTE_NAMES> {
  constructor(gl: WebGLRenderingContext) {
    super(GradientColorProgram.createContextStatic(gl, GradientColorProgram.createProgramStatic(gl)))
    this.syncCanvasSize()
    this.gl.clearColor(1, 1, 1, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  protected static createProgramStatic(gl: WebGLRenderingContext): WebGLProgram {
    return WebGLProgramBuilder.create(gl, vertexSource, fragmentSource)
  }

  protected createProgram(gl: WebGLRenderingContext): WebGLProgram {
    return GradientColorProgram.createProgramStatic(gl)
  }

  protected static createContextStatic(gl: WebGLRenderingContext, program: WebGLProgram) {
    return BaseProgram.makeBaseContextFromAttributes(gl, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createContext(context: WebGLRenderingContext, program: WebGLProgram) {
    return GradientColorProgram.createContextStatic(context, program)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const size = this.getCanvasSize()
    this.gl.canvas.width = size.width
    this.gl.canvas.height = size.height
    const canvasSize = this.gl.getUniformLocation(this.program, "uResolution")
    this.gl.uniform2f(canvasSize, size.width, size.height)
    return this
  }

  public getColorAtPosition([x, y]: Vec2): Color {
    const { gl } = this
    const pixelData = new Uint8Array(4)

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.readPixels(x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)

    this.checkError()

    return new Color(pixelData[0], pixelData[1], pixelData[2], 255)
  }

  public draw() {
    const { gl } = this
    this.useProgram()

    this.bufferAttribute("aPosition", new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), {
      usage: gl.STATIC_DRAW,
      size: 2,
      type: gl.FLOAT,
      isNormalized: false,
      stride: 0,
      offset: 0,
    })

    // fill the canvas:
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    this.checkError()
  }
}
