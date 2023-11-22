export abstract class BaseProgram {
  public abstract readonly gl: WebGLRenderingContext

  constructor(public readonly program: WebGLProgram) {}

  public useProgram(): typeof this {
    this.gl.useProgram(this.program)
    this.syncCanvasSize()
    return this
  }

  public syncCanvasSize(): typeof this {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public createBuffer(target = this.gl.ARRAY_BUFFER): WebGLBuffer {
    const buffer = this.gl.createBuffer()
    if (!buffer) {
      throw new Error("Failed to create buffer")
    }
    this.gl.bindBuffer(target, buffer)
    return buffer
  }

  public checkError(): typeof this {
    const error = this.gl.getError()
    if (error !== this.gl.NO_ERROR) {
      throw new Error("WebGL error: " + error)
    }
    return this
  }
}
