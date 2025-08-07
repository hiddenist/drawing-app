import { WebGLProgramBuilder, BaseProgram, Color } from "@libs/shared"
import sourceMap, { uniformNames, attributeNames } from "./shaders/sourceMap"

const VERTEX_SHADER = "soft.vertex"
const FRAGMENT_SHADER = "soft.fragment"
const UNIFORM_NAMES = { ...uniformNames[VERTEX_SHADER], ...uniformNames[FRAGMENT_SHADER] } as const
const ATTRIBUTE_NAMES = { ...attributeNames[VERTEX_SHADER] } as const

export interface StrokePoint {
  x: number
  y: number
  radius: number
  hardness: number
  flow: number
}

export interface SoftBrushOptions {
  color?: Color
  opacity?: number
}

export class SoftBrushProgram extends BaseProgram<keyof typeof UNIFORM_NAMES, keyof typeof ATTRIBUTE_NAMES> {
  private strokeTexture: WebGLTexture | null = null

  constructor(gl: WebGL2RenderingContext, pixelDensity: number) {
    super(SoftBrushProgram.createContextStatic(gl, SoftBrushProgram.createProgramStatic(gl)), pixelDensity)
  }

  protected static createProgramStatic(gl: WebGL2RenderingContext): WebGLProgram {
    return WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, VERTEX_SHADER, FRAGMENT_SHADER)
  }

  protected createProgram(gl: WebGL2RenderingContext): WebGLProgram {
    return SoftBrushProgram.createProgramStatic(gl)
  }

  protected static createContextStatic(context: WebGL2RenderingContext, program: WebGLProgram) {
    return BaseProgram.getProgramInfo(context, program, UNIFORM_NAMES, ATTRIBUTE_NAMES)
  }

  protected createProgramInfo(context: WebGL2RenderingContext, program: WebGLProgram) {
    return SoftBrushProgram.createContextStatic(context, program)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    this.gl.uniform2f(this.getUniformLocation("canvasSize"), this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  private createStrokeTexture(strokePoints: StrokePoint[]) {
    if (!this.strokeTexture) {
      this.strokeTexture = this.gl.createTexture()
    }

    const width = strokePoints.length
    const height = 2 // Two rows: stroke data and flow data

    // Create stroke data array
    const strokeData = new Float32Array(width * height * 4)

    // Fill first row with stroke data (x, y, radius, hardness)
    for (let i = 0; i < strokePoints.length; i++) {
      const point = strokePoints[i]
      const idx = i * 4
      strokeData[idx] = point.x
      strokeData[idx + 1] = point.y
      strokeData[idx + 2] = point.radius
      strokeData[idx + 3] = point.hardness
    }

    // Fill second row with flow data (flow, unused, unused, unused)
    for (let i = 0; i < strokePoints.length; i++) {
      const point = strokePoints[i]
      const idx = (width + i) * 4
      strokeData[idx] = point.flow
      strokeData[idx + 1] = 0
      strokeData[idx + 2] = 0
      strokeData[idx + 3] = 0
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.strokeTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA32F,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.FLOAT,
      strokeData,
    )
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }

  public drawStroke(strokePoints: StrokePoint[], options: SoftBrushOptions = {}) {
    const { color = Color.BLACK, opacity = 1.0 } = options

    if (strokePoints.length === 0) return

    this.useProgram()
    this.syncCanvasSize()

    // Create stroke texture
    this.createStrokeTexture(strokePoints)

    // Set uniforms
    this.gl.uniform1i(this.getUniformLocation("strokeData"), 0)
    this.gl.uniform1i(this.getUniformLocation("numPoints"), strokePoints.length)
    this.gl.uniform1f(this.getUniformLocation("opacity"), opacity)
    this.gl.uniform3fv(this.getUniformLocation("color"), color.vec3)

    // Bind stroke texture
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.strokeTexture)

    // Create fullscreen quad
    const quadVertices = new Float32Array([
      -1.0,
      -1.0,
      0.0,
      0.0, // Bottom-left
      1.0,
      -1.0,
      1.0,
      0.0, // Bottom-right
      -1.0,
      1.0,
      0.0,
      1.0, // Top-left
      1.0,
      1.0,
      1.0,
      1.0, // Top-right
    ])

    // Buffer attributes
    this.bufferAttribute("position", quadVertices, { usage: this.gl.STATIC_DRAW, size: 2, stride: 4 * 4, offset: 0 })
    this.bufferAttribute("texCoord", quadVertices, {
      usage: this.gl.STATIC_DRAW,
      size: 2,
      stride: 4 * 4,
      offset: 2 * 4,
    })

    // Draw quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    this.checkError()

    // Cleanup
    this.gl.bindTexture(this.gl.TEXTURE_2D, null)
  }

  public dispose() {
    if (this.strokeTexture) {
      this.gl.deleteTexture(this.strokeTexture)
      this.strokeTexture = null
    }
  }
}
