import positionVertexSource from "../shaders/position.vertex.glsl"
import fragmentShaderSource from "../shaders/color.fragment.glsl"

import { Color } from "./Color"
import { ColorContext } from "./ColorContext"
import { WebGLProgramBuilder } from "./WebGLProgramBuilder"

interface WebGLProgramRecord {
  simple2d: WebGLProgram
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
      simple2d: WebGLProgramBuilder.create(gl, positionVertexSource, fragmentShaderSource),
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
