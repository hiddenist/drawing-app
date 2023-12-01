import { Layer } from "../engine/Layer"
import { SimpleTextureProgram } from "./abstract/SimpleTextureProgram"

export class TextureDrawingProgram extends SimpleTextureProgram {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(gl, pixelDensity)
  }

  protected useLayer(layer: Layer) {
    this.gl = layer.gl
    return layer
  }

  prepareTextureForDrawing(layer: Layer) {
    const { gl, frameBuffer, texture } = this.useLayer(layer)
    const { width, height } = this.getCanvasSize()
    gl.viewport(0, 0, width, height)

    // Enable blending
    gl.enable(gl.BLEND)

    // Set the blend function
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
    this.syncCanvasSize()

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // Allocate memory for the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

    // Attach the texture to the framebuffer
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

    // Check the framebuffer status
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Error setting up framebuffer")
    }
  }

  drawTexture(layer: Layer) {
    const { gl, texture } = this.useLayer(layer)

    // Unbind the framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindTexture(gl.TEXTURE_2D, texture)

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
