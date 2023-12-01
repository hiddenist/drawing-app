export class Layer {
  protected readonly _gl: WebGLRenderingContext
  protected _texture?: WebGLTexture
  protected _frameBuffer?: WebGLFramebuffer

  public constructor(gl: WebGLRenderingContext) {
    this._gl = gl
  }

  protected createTexture(gl: WebGLRenderingContext) {
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error("Could not create texture")
    }
    return texture
  }

  protected createFrameBuffer(gl: WebGLRenderingContext) {
    const frameBuffer = gl.createFramebuffer()
    if (!frameBuffer) {
      throw new Error("Could not create framebuffer")
    }
    return frameBuffer
  }

  public get gl() {
    return this._gl
  }

  public get frameBuffer() {
    if (!this._frameBuffer) {
      this._frameBuffer = this.createFrameBuffer(this._gl)
    }
    return this._frameBuffer
  }

  public get texture() {
    if (!this._texture) {
      this._texture = this.createTexture(this._gl)
    }
    return this._texture
  }
}
