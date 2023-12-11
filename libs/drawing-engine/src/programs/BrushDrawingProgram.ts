import { BrushProgramBase } from "./base/BrushProgramBase"
import { DrawType } from "./base/PositionColorProgramBase"
import { Color } from "@libs/shared"

export { DrawType } from "./base/PositionColorProgramBase"

export interface LineInfo {
  points: number[]
  pressure?: number[]
}

export class BrushDrawingProgram extends BrushProgramBase {
  constructor(gl: WebGLRenderingContext, pixelDensity: number) {
    super(gl, pixelDensity)
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    this.gl.uniform2f(this.getUniformLocation("canvasSize"), this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public draw({ points }: Readonly<LineInfo>, { drawType = this.gl.STREAM_DRAW, ...options }: BrushDrawOptions = {}) {
    this.useProgram()
    this.syncCanvasSize()

    this.setBrushOptions(options)

    // if (pressure && pressure.length !== points.length / 2) {
    //   console.warn("Pressure array should be the same length as the points array", {
    //     pressureValues: pressure.length,
    //     points: points.length / 2,
    //   })
    // }

    // const hasPressureData = (pressure?.filter((p) => p > 0).length ?? 0) > 1

    // if (hasPressureData) {
    //   this.bufferAttribute("pressure", new Float32Array(pressure!), { usage: drawType, size: 1 })
    // }

    const canvasBounds = [-1, -1, 1, -1, -1, 1, 1, 1]

    // repeat the bounds until it's the same length as the points array
    const bounds = new Array(points.length).fill(0).map((_, i) => canvasBounds[i % canvasBounds.length])

    this.bufferAttribute("bounds", new Float32Array(bounds), { usage: drawType, size: 2 })
    this.bufferAttribute("position", new Float32Array(points), { usage: drawType, size: 2 })
    this.gl.drawArrays(this.gl.TRIANGLES, 0, points.length / 2)
    this.checkError()
  }

  private setBrushOptions({
    color = Color.BLACK,
    diameter = 5.0,
    minDiameter = 1.0,
    opacity = 255,
    hardness = 1.0,
    flow = 1.0,
  }: Omit<BrushDrawOptions, "drawType">) {
    this.gl.uniform1f(this.getUniformLocation("opacity"), opacity)
    this.gl.uniform1f(this.getUniformLocation("strokeRadiusMax"), diameter / 2)
    this.gl.uniform1f(this.getUniformLocation("strokeRadiusMin"), minDiameter / 2)
    this.gl.uniform2fv(this.getUniformLocation("hardness"), [hardness, hardness])
    this.gl.uniform2fv(this.getUniformLocation("flow"), [flow, flow])
    // not sure what this should be yet
    this.gl.uniform1f(this.getUniformLocation("strokeLength"), 1.0)
    this.gl.uniform3fv(this.getUniformLocation("color"), color.vec3)

    const isPremultipliedAlpha = this.gl.getParameter(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)

    this.gl.uniform1i(this.getUniformLocation("isPremultipliedAlpha"), isPremultipliedAlpha ? 1 : 0)

    // uniform float uOpacity;
    // uniform float uStrokeRadiusMax;
    // uniform float uStrokeRadiusMin;
    // uniform vec2 uHardness;
    // uniform vec2 uFlow;
    // uniform vec3 uColor;
    // uniform float uStrokeLength;
    // uniform bool uIsPremultipliedAlpha;
  }
}

export interface BrushDrawOptions {
  /**
   * The draw type to use when drawing the line. Defaults to `gl.STREAM_DRAW`.
   */
  drawType?: DrawType
  /*
   * The color to use when drawing the line. Black if not specified.
   */
  color?: Color

  /**
   * The diameter of the line. Defaults to 5.0.
   */
  diameter?: number

  /**
   * The minimum diameter of the line. Defaults to 1.0.
   */
  minDiameter?: number

  /**
   * The opacity of the line. Defaults to 255.0.
   */
  opacity?: number

  hardness?: number
  flow?: number
}
