export interface LayerSettings {
  clearBeforeDrawing?: boolean
}

export type Image = ImageData | HTMLImageElement | HTMLCanvasElement | ImageBitmap

export class Layer {
  protected readonly _gl: WebGLRenderingContext
  protected _texture?: WebGLTexture
  protected _frameBuffer?: WebGLFramebuffer

  public constructor(
    gl: WebGLRenderingContext,
    protected _settings: LayerSettings = {},
    fromImage: null | Image = null
  ) {
    this._gl = gl

    if (fromImage) {
      this._texture = this.createTexture(gl, fromImage)
    }
  }

  public get settings(): Readonly<LayerSettings> {
    return this._settings
  }

  protected createTexture(gl: WebGLRenderingContext, image: Image | null = null) {
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error("Could not create texture")
    }
    gl.bindTexture(gl.TEXTURE_2D, texture)

    const { width, height } = this.gl.canvas
    if (image) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image)
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
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

  public clear() {
    const { gl } = this

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0)
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  public get frameBuffer() {
    if (!this._frameBuffer) {
      this._frameBuffer = this.createFrameBuffer(this._gl)
    }
    return this._frameBuffer
  }

  public get texture() {
    if (!this._texture) {
      const gl = this._gl
      const texture = this.createTexture(gl)

      this._texture = texture
    }
    return this._texture
  }
}
