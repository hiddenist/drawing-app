import { VectorArray } from "../types/arrays"
import { BaseDrawingApp } from "./BaseDrawingApp"

export class LineDrawingApp extends BaseDrawingApp {
  public drawLine(points: VectorArray<4>) {
    const simple2d = this.programs.simple2d
    const buffer = simple2d.prepareBuffer()

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(points), this.gl.STATIC_DRAW)

    simple2d.setColor(this.color.foreground)

    // credit and reference:
    // https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

    var stride = 0 // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0 // start at the beginning of the buffer

    this.gl.vertexAttribPointer(
      simple2d.position,
      2,
      this.gl.FLOAT,
      false,
      stride,
      offset
    )

    this.gl.drawArrays(this.gl.LINES, 0, points.length / 2)
    
    this.checkError()
  }
}