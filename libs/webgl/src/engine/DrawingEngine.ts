import { ColorContext } from "./ColorContext"
import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { BaseDrawingEngine } from "./BaseDrawingEngine"
import { Path } from "./Path"
import { VectorArray } from "../types/arrays"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
}

export class DrawingEngine extends BaseDrawingEngine<AvailablePrograms> {
  protected context = {
    color: new ColorContext(),
    currentPath: new Path(),
    pathHistory: [] as Array<ReadonlyArray<number>>,
    isDrawing: false,
    cursorPosition: [0, 0] as Readonly<VectorArray<2>>,
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, (gl) => ({
      lineDrawing: new LineDrawingProgram(gl),
    }))
  }

  public updateDrawing() {
    for (const path of this.context.pathHistory) {
      this.drawLine(path, { drawType: DrawType.STATIC_DRAW })
    }
    if (this.context.currentPath.points.length > 0) {
      this.drawLine(this.context.currentPath.points, { drawType: DrawType.DYNAMIC_DRAW })
    }
    if (!this.context.isDrawing) {
      this.drawCursor()
    }
  }

  private drawCursor() {
    const position = this.context.cursorPosition
    const cursorSize = 2
    const x = position[0]
    const y = position[1]
    this.drawLine(
      [
        x - cursorSize,
        y - cursorSize,

        x + cursorSize,
        y - cursorSize,

        x + cursorSize,
        y + cursorSize,

        x - cursorSize,
        y + cursorSize,

        x - cursorSize,
        y - cursorSize,
      ],
      {
        drawType: DrawType.DYNAMIC_DRAW,
      },
    )
  }

  public drawLine(points: ReadonlyArray<number>, options?: DrawLineOptions) {
    if (points.length === 2) {
      points = [...points, ...points.map((p) => p + 1)]
    }
    this.getProgram("lineDrawing").drawLine(points, this.color.foreground, options)
  }

  public get color(): ColorContext {
    return this.context.color
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: Readonly<VectorArray<2>>) {
    this.context.isDrawing = pressed
    if (pressed) {
      this.context.currentPath.add(position)
      this.updateDrawing()
    } else {
      this.commitPath(this.context.currentPath.clear())
    }
  }

  protected commitPath(path: ReadonlyArray<number>) {
    if (path.length === 0) {
      return
    }
    this.drawLine(path, { drawType: DrawType.STATIC_DRAW })
    this.context.pathHistory.push(path)
  }

  public addPosition(position: Readonly<VectorArray<2>>) {
    if (this.context.isDrawing) {
      this.context.currentPath.add(position)
    }
    this.context.cursorPosition = position
    this.updateDrawing()
  }
}
