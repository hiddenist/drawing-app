import { WebGLProgramBuilder } from "@libs/shared"
import { Color, BaseProgram } from "@libs/shared"
import sourceMap from "./shaders/sourceMap"
import getNormals from "polyline-normals"

export class LineDrawingProgram extends BaseProgram {
  constructor(public readonly gl: WebGLRenderingContext) {
    super(WebGLProgramBuilder.createFromSourceMap(gl, sourceMap, "lines.vertex", "lines.fragment"))
  }

  public syncCanvasSize(): typeof this {
    super.syncCanvasSize()
    const canvasSize = this.gl.getUniformLocation(this.program, "uCanvasSize")
    this.gl.uniform2f(canvasSize, this.gl.canvas.width, this.gl.canvas.height)
    return this
  }

  public setColor(color: Color): LineDrawingProgram {
    const colorLocation = this.gl.getUniformLocation(this.program, "uColor")
    if (!colorLocation) {
      throw new Error("Failed to get color location. Does the specified program have a 'color' uniform?")
    }
    this.gl.uniform4fv(colorLocation, color.vec4)
    return this
  }

  public drawLine(points: ReadonlyArray<number>, { drawType = this.gl.STREAM_DRAW, color }: DrawLineOptions) {
    this.setColor(color)

    this.setPositionAttr(points, drawType)
    this.setNormalsAndMiterAttrs(points, drawType)

    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, points.length / 2)

    this.checkError()
  }

  protected setNormalsAndMiterAttrs(points: ReadonlyArray<number>, drawType: DrawType): void {
    const points2d = points.reduce((acc: Array<[number, number]>, val, i) => {
      if (i % 2 === 0) {
        acc.push([val, points[i + 1]])
      }
      return acc
    }, [])

    const normals = points2d.flatMap(([x, y], i, arr) => {
      const nextPoint = arr[i + 1] || arr[0]
      const dx = nextPoint[0] - x
      const dy = nextPoint[1] - y
      const length = Math.sqrt(dx * dx + dy * dy)
      const normalX = dy / length
      const normalY = -dx / length
      return [normalX, normalY]
    })

    this.bufferAttribute("aNormal", new Float32Array(normals), drawType, 2) // Use 2 for the size since we have x and y components

    // this.bufferAttribute("aMiter", new Float32Array(miters), drawType, 1)
  }

  protected setPositionAttr(points: ReadonlyArray<number>, drawType: DrawType): void {
    this.bufferAttribute("aPosition", new Float32Array(points), drawType, 2)
  }

  protected bufferAttribute(attrName: string, data: Readonly<Float32Array>, drawType: DrawType, size: number): void {
    this.createBuffer()
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, drawType)
    const attr = this.gl.getAttribLocation(this.program, attrName)
    this.gl.enableVertexAttribArray(attr)
    this.gl.vertexAttribPointer(attr, size, this.gl.FLOAT, false, 0, 0)
  }
}

export interface DrawLineOptions {
  /**
   * The draw type to use when drawing the line. Defaults to `gl.STREAM_DRAW`.
   */
  drawType?: DrawType
  /*
   * The color to use when drawing the line.
   */
  color: Color
}

export enum DrawType {
  STATIC_DRAW = WebGLRenderingContext.STATIC_DRAW,
  DYNAMIC_DRAW = WebGLRenderingContext.DYNAMIC_DRAW,
  STREAM_DRAW = WebGLRenderingContext.STREAM_DRAW,
}

export enum LineMode {
  LINE_STRIP = WebGLRenderingContext.LINE_STRIP,
  LINE_LOOP = WebGLRenderingContext.LINE_LOOP,
  LINES = WebGLRenderingContext.LINES,
}
