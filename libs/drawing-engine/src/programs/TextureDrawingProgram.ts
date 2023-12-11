import { Layer } from "../engine/Layer"
import { TextureProgramBase } from "./base/TextureProgramBase"

export class TextureDrawingProgram extends TextureProgramBase {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(gl, pixelDensity)
  }

  public createTextureImage(layer: Layer, drawImage: () => void) {
    const { gl } = this
    this._createTextureImage(layer.texture, layer.frameBuffer, () => {
      if (layer.settings.clearBeforeDrawing) {
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
      }
      drawImage()
    })
  }

  protected _createTextureImage(texture: WebGLTexture, frameBuffer: WebGLFramebuffer, drawImage: () => void) {
    const { gl } = this
    this.useProgram()

    const { width, height } = this.getCanvasSize()

    gl.viewport(0, 0, width, height)

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Allocate memory for the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    // Check the framebuffer status
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Error setting up framebuffer")
    }

    drawImage()

    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  public mergeDown(foreground: Layer, background: Layer) {
    const { gl } = this
    const copy = new Layer(gl)
    this.createTextureImage(copy, () => {
      this.drawTextures(foreground.texture, background.texture)
    })
    return copy
  }

  public draw(foreground: Layer, background: Layer) {
    this.drawTextures(foreground.texture, background.texture)
  }

  protected drawTextures(front: WebGLTexture, back: WebGLTexture) {
    const { gl } = this
    this.useProgram()

    gl.uniform1i(this.getUniformLocation("background"), 1)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, back)

    gl.uniform1i(this.getUniformLocation("foreground"), 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, front)

    this.bufferAttribute(
      "position",
      new Float32Array([
        -1,
        -1, // bottom-left
        1,
        -1, // bottom-right
        -1,
        1, // top-left
        -1,
        1, // top-left
        1,
        -1, // bottom-right
        1,
        1, // top-right
      ]),
      { usage: gl.STATIC_DRAW, size: 2 },
    )

    this.bufferAttribute(
      "textureCoordinates",
      new Float32Array([
        0,
        0, // bottom-left
        1,
        0, // bottom-right
        0,
        1, // top-left
        0,
        1, // top-left
        1,
        0, // bottom-right
        1,
        1, // top-right
      ]),
      { usage: gl.STATIC_DRAW, size: 2 },
    )

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }
}
