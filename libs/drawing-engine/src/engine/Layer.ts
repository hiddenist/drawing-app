import { getImageDimensions } from "../utils/image/getImageDimensions"

export interface LayerSettings {
  clearBeforeDrawing?: boolean
}

export class Layer {
  protected readonly _gl: WebGLRenderingContext
  protected _texture?: WebGLTexture
  protected _frameBuffer?: WebGLFramebuffer

  public constructor(
    gl: WebGLRenderingContext,
    protected _settings: LayerSettings = {},
    fromSource?: TexImageSource,
  ) {
    this._gl = gl

    if (fromSource) {
      this._texture = this.createTexture(gl, fromSource)
    }
  }

  public get settings(): Readonly<LayerSettings> {
    return this._settings
  }

  protected createTexture(gl: WebGLRenderingContext, source?: TexImageSource) {
    const texture = gl.createTexture()
    if (!texture) {
      throw new Error("Could not create texture")
    }
    gl.bindTexture(gl.TEXTURE_2D, texture)

    const target = gl.TEXTURE_2D
    const level = 0
    const internalFormat = gl.RGBA
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const border = 0
    const { width, height } = this.gl.canvas

    if (source) {
      if (source instanceof HTMLElement) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      }
      const dims = getImageDimensions(source)

      if (dims && dims.width < width && dims.height < height) {
        const [offsetX, offsetY] = this.getImageOffset(source)
        const transparentPixels = new Uint8Array(width * height * 4)
        gl.texImage2D(target, level, internalFormat, width, height, border, srcFormat, srcType, transparentPixels)
        gl.texSubImage2D(gl.TEXTURE_2D, level, offsetX, offsetY, srcFormat, srcType, source)
      } else {
        gl.texImage2D(target, level, internalFormat, srcFormat, srcType, source)
      }
    } else {
      gl.texImage2D(target, level, internalFormat, width, height, border, srcFormat, srcType, null)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindTexture(gl.TEXTURE_2D, null)
    return texture
  }

  protected getImageOffset(source: TexImageSource) {
    const { width, height } = this.gl.canvas
    const canvasAspectRatio = width / height

    const sourceDim = getImageDimensions(source) ?? { width, height }
    const aspectRatio = sourceDim.width / sourceDim.height

    let offsetX = 0
    let offsetY = 0

    if (aspectRatio < canvasAspectRatio || sourceDim.height != height) {
      offsetY = (height - sourceDim.height) / 2
    }

    if (aspectRatio > canvasAspectRatio || sourceDim.width != width) {
      offsetX = (width - sourceDim.width) / 2
    }

    return [offsetX, offsetY]
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
