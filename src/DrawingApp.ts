import vertexShaderSource from "./shaders/vertex.glsl"
import fragmentShaderSource from "./shaders/fragment.glsl"

import { Color } from "./Color"

export class DrawingApp {
  private gl: WebGLRenderingContext
  private vertexShader: WebGLShader
  private fragmentShader: WebGLShader
  public readonly program: WebGLProgram

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl")
    if (!gl) {
      throw new Error("WebGL not supported")
    }
    this.gl = gl

    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER)
    this.fragmentShader = this.createShader(
      fragmentShaderSource,
      gl.FRAGMENT_SHADER
    )

    this.program = this.createProgram(this.vertexShader, this.fragmentShader)
  }

  public resetCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  private createShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)
    if (!shader) {
      throw new Error("Failed to create shader")
    }
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        "Failed to compile shader: " + this.gl.getShaderInfoLog(shader)
      )
    }
    return shader
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ): WebGLProgram {
    const program = this.gl.createProgram()
    if (!program) {
      throw new Error("Failed to create program")
    }
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error(
        "Failed to link program: " + this.gl.getProgramInfoLog(program)
      )
    }
    this.resetCanvas()
    return program
  }

  public drawLine(points: [number, number, number, number], color: Color = Color.WHITE) {
    const buffer = this.gl.createBuffer()
    if (!buffer) {
      throw new Error("Failed to create buffer")
    }
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), this.gl.STATIC_DRAW)
    const position = this.gl.getAttribLocation(this.program, "position")

    
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
    this.gl.useProgram(this.program)
    
    this.gl.enableVertexAttribArray(position)
    
    this.gl.vertexAttribPointer(position, 2, this.gl.FLOAT, false, 0, 0)
    this.setColor(color)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    
    // credit and reference:
    // https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = this.gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    this.gl.vertexAttribPointer(
      position, size, type, normalize, stride, offset)

    this.gl.drawArrays(this.gl.LINES, 0, points.length / 2)
  }

  public setColor(color: Color) {
    const colorLocation = this.gl.getUniformLocation(this.program, "color")
    this.gl.uniform4fv(colorLocation, color.toVector4())
  }

}
