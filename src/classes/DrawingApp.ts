import positionVertexSource from "../shaders/position.vertex.glsl"
import fragmentShaderSource from "../shaders/color.fragment.glsl"

import { Color } from "./Color"
import { WebGLProgramBuilder } from "./WebGLProgramBuilder"
import type { VectorArray } from "../types/arrays"

interface WebGLProgramRecord {
  simple2d: WebGLProgram
}

export class DrawingApp {
  private gl: WebGLRenderingContext
  private programs: WebGLProgramRecord
  private colors: [Color, Color] = [Color.BLACK, Color.WHITE]

  get currentColors(): Readonly<[Color, Color]> {
    return this.colors
  }

  get foregroundColor(): Color {
    return this.colors[0]
  }

  get backgroundColor(): Color {
    return this.colors[1]
  }

  set foregroundColor(color: Color) {
    this.colors[0] = color
  }

  set backgroundColor(color: Color) {
    this.colors[1] = color
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

  public resetCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public drawLine(points: VectorArray<4>) {
    const program = this.programs.simple2d
    const buffer = this.gl.createBuffer()
    if (!buffer) {
      throw new Error("Failed to create buffer")
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), this.gl.STATIC_DRAW)
    const position = this.gl.getAttribLocation(program, "position")

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.useProgram(program)

    this.gl.enableVertexAttribArray(position)

    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0)
    this.setColor(program, this.foregroundColor)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)

    // credit and reference:
    // https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2 // 2 components per iteration
    var type = this.gl.FLOAT // the data is 32bit floats
    var normalize = false // don't normalize the data
    var stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0 // start at the beginning of the buffer
    this.gl.vertexAttribPointer(position, size, type, normalize, stride, offset)

    this.gl.drawArrays(this.gl.LINES, 0, points.length / 2)
  }

  public setColor(program: WebGLProgram, color: Color) {
    const colorLocation = this.gl.getUniformLocation(program, "color")
    if (!colorLocation) {
      throw new Error("Failed to get color location. Does the specified program have a 'color' uniform?")
    }
    this.gl.uniform4fv(colorLocation, color.toVector4())
  }
}
