import { Color } from "../classes/Color"
import { ColorContext } from "./ColorContext"
import { Simple2dProgram } from "../programs/Simple2dProgram/Simple2dProgram"

interface WebGLProgramRecord {
  simple2d: Simple2dProgram
}

export class BaseDrawingApp {
  protected gl: WebGLRenderingContext
  protected programs: WebGLProgramRecord
  protected context = {
    color: new ColorContext()
  }

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl")
    if (!gl) {
      throw new Error("WebGL not supported")
    }
    this.gl = gl

    this.programs = {
      simple2d: new Simple2dProgram(gl),
    }
  }

  public get color(): ColorContext {
    return this.context.color
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public setColor(program: WebGLProgram, color: Color) {
    const colorLocation = this.gl.getUniformLocation(program, "color")
    if (!colorLocation) {
      throw new Error("Failed to get color location. Does the specified program have a 'color' uniform?")
    }
    this.gl.uniform4fv(colorLocation, color.toVector4())
  }
}
