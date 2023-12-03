import { BaseProgram, ProgramInfo, Vec2, Color } from "@libs/shared"

export abstract class BaseGradientColorProgram<
  U extends string,
  A extends string,
  ExtendableContext extends ProgramInfo<U, A> = ProgramInfo<U, A>,
> extends BaseProgram<U, A> {
  constructor(
    context: ExtendableContext,
    private positionAttrib: A,
    private resolutionUniform: U,
  ) {
    super(context)
    this.syncCanvasSize()
    this.gl.clearColor(1, 1, 1, 1)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const size = this.getCanvasSize()
    this.gl.canvas.width = size.width
    this.gl.canvas.height = size.height
    const canvasSize = this.getUniformLocation(this.resolutionUniform)
    this.gl.uniform2f(canvasSize, size.width, size.height)
    return this
  }

  public getColorAtPosition([x, y]: Vec2): Color {
    const { gl } = this
    const pixelData = new Uint8Array(4)

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.readPixels(x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData)

    this.checkError()

    return new Color(pixelData[0], pixelData[1], pixelData[2])
  }

  protected draw() {
    const { gl } = this
    this.useProgram()

    this.setUniforms()

    this.bufferAttribute(this.positionAttrib, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), {
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

  protected abstract setUniforms(): void
}
