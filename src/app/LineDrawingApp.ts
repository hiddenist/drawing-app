import { VectorArray } from "../types/arrays"
import { BaseDrawingApp } from "./BaseDrawingApp"

export class LineDrawingApp extends BaseDrawingApp {
  public drawLine(points: VectorArray<4>) {
    const program = this.programs.simple2d.program
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

    this.setColor(program, this.color.foreground)

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
}