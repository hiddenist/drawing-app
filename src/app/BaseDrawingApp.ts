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

  public checkError() {
    const error = this.gl.getError()
    if (error !== this.gl.NO_ERROR) {
      throw new Error("WebGL error: " + error)
    }
  }

  public get color(): ColorContext {
    return this.context.color
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }
}
