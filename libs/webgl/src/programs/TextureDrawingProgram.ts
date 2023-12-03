import { Layer } from "../engine/Layer"
import { SimpleTextureProgram } from "./abstract/SimpleTextureProgram"

export class TextureDrawingProgram extends SimpleTextureProgram {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(gl, pixelDensity)
  }

  prepareTextureForDrawing(layer: Layer) {
    const { gl } = this
    const { texture, frameBuffer } = layer
    this.useProgram()

    const { width, height } = this.getCanvasSize()

    gl.viewport(0, 0, width, height)

    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

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

    if (layer.settings.clearBeforeDrawing) {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
  }

  drawTextures(foreground: Layer, background: Layer) {
    const { gl } = this
    this.useProgram()
    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    // gl.uniform1i(this.getUniformLocation("background"), 1)
    // gl.activeTexture(gl.TEXTURE1)
    // gl.bindTexture(gl.TEXTURE_2D, background.texture)

    gl.uniform1i(this.getUniformLocation("foreground"), 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, foreground.texture)

    gl.enable(gl.BLEND)
    gl.blendEquation(gl.FUNC_ADD)
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

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
