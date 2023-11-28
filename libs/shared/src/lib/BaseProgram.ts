export abstract class BaseProgram {
  public program: WebGLProgram
  protected currentGl: WebGLRenderingContext

  constructor(protected _gl: WebGLRenderingContext) {
    this.currentGl = _gl
    this.program = this.createProgram()
  }

  set gl(value: WebGLRenderingContext) {
    this.currentGl = value
    this.program = this.createProgram()
    this.useProgram()
  }

  get gl(): WebGLRenderingContext {
    return this.currentGl
  }

  protected abstract createProgram(): WebGLProgram

  public useProgram(): typeof this {
    this.gl.useProgram(this.program)
    this.syncCanvasSize()
    return this
  }

  public syncCanvasSize(): typeof this {
    const { width, height } = this.getCanvasSize()
    this.gl.viewport(0, 0, width, height)
    return this
  }

  public getCanvasSize(): { width: number; height: number } {
    const canvas = this.gl.canvas
    if (!(canvas instanceof HTMLElement)) {
      throw new Error("Could not get canvas size, canvas is not an HTMLCanvasElement")
    }
    const boundingRect = canvas.getBoundingClientRect()

    return { width: boundingRect.width, height: boundingRect.height }
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
