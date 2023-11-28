import { BaseProgram, WebGLProgramBuilder, Vec2, Color } from "@libs/shared"
import fragmentSource from "../shaders/fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"

export class GradientColorProgram extends BaseProgram {
  constructor(gl: WebGLRenderingContext) {
    super(gl)
    this.useProgram().syncCanvasSize()
    this.gl.clearColor(1, 1, 1, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  protected createProgram(): WebGLProgram {
    return WebGLProgramBuilder.create(this.gl, vertexSource, fragmentSource)
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
    this.createBuffer()

    // fill the canvas:
    const position = this.gl.getAttribLocation(this.program, "aPosition")
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    this.checkError()
  }
}
