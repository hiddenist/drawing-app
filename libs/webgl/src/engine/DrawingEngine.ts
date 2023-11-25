import { ColorContext } from "./ColorContext"
import { LineDrawingProgram, DrawLineOptions, DrawType } from "../programs/LineDrawingProgram"
import { BaseDrawingEngine } from "./BaseDrawingEngine"
import { Path } from "./Path"
import type { Vec2 } from "@libs/shared"
import { Color } from "@libs/shared"

interface AvailablePrograms {
  lineDrawing: LineDrawingProgram
}

interface HistoryItem {
  path: ReadonlyArray<number>
  color: Color
}

export class DrawingEngine extends BaseDrawingEngine<AvailablePrograms> {
  protected context = {
    color: new ColorContext(),
    currentPath: new Path(),
    pathHistory: [] as Array<HistoryItem>,
    isDrawing: false,
    cursorPosition: [] as Readonly<Vec2 | []>,
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, (gl) => ({
      lineDrawing: new LineDrawingProgram(gl),
    }))
  }

  public updateDrawing() {
    for (const { path, color } of this.context.pathHistory) {
      this.drawLine(path, { drawType: DrawType.STATIC_DRAW, color })
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
    if (position[0] === undefined || position[1] === undefined) {
      return
    }
    const cursorSize = 2
    const x = position[0]
    const y = position[1]
    this.drawLine(
      [
        x - cursorSize,
        y - cursorSize,

        x - cursorSize,
        y + cursorSize,

        x + cursorSize,
        y + cursorSize,

        x + cursorSize,
        y - cursorSize,

        x - cursorSize,
        y - cursorSize,
      ],
      {
        drawType: DrawType.DYNAMIC_DRAW,
        // todo: this doesn't work yet, everything is the same color. do we need to create a new program for the cursor?
        color: Color.WHITE,
      },
    )
  }

  public drawLine(
    points: ReadonlyArray<number>,
    { color = this.color.foreground, ...options }: Partial<DrawLineOptions> = {},
  ) {
    if (points.length === 2) {
      points = [...points, ...points.map((p) => p + 1)]
    }
    this.getProgram("lineDrawing").drawLine(points, {
      ...options,

      color: this.color.foreground,
    })
  }

  private get color(): ColorContext {
    return this.context.color
  }

  public setColor(color: Color) {
    this.color.setForeground(color)
  }

  public clearCanvas() {
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: Readonly<Vec2>) {
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
    this.context.pathHistory.push({ path, color: this.color.foreground })
  }

  public setCursorPosition(position: typeof this.context.cursorPosition) {
    this.context.cursorPosition = position
  }

  public addPosition(position: Readonly<Vec2>) {
    if (this.context.isDrawing) {
      this.context.currentPath.add(position)
    }
    this.updateDrawing()
  }
}
