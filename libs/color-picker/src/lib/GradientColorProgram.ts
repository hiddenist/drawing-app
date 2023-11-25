import { BaseProgram, WebGLProgramBuilder, Vec2, Color } from "@libs/shared"
import fragmentSource from "../shaders/fragment.glsl"
import vertexSource from "../shaders/vertex.glsl"

export class GradientColorProgram extends BaseProgram {
  constructor(public readonly gl: WebGLRenderingContext) {
    super(WebGLProgramBuilder.create(gl, vertexSource, fragmentSource))
    this.useProgram().syncCanvasSize()
    this.gl.clearColor(1, 1, 1, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const canvasSize = this.gl.getUniformLocation(this.program, "u_resolution")
    this.gl.uniform2f(canvasSize, this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public getColorAtPosition(position: Vec2): Color {
    const { gl } = this
    const pixelData = new Uint8Array(4)

    this.draw()
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.readPixels(position[0], position[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)
    console.log(pixelData)

    this.checkError()

    return new Color(pixelData[0], pixelData[1], pixelData[2], pixelData[3] / 255)
  }

  public draw() {
    const { gl } = this
    this.useProgram()
    this.createBuffer()

    const position = this.gl.getAttribLocation(this.program, "a_position")
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(position)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    this.checkError()
  }
}
