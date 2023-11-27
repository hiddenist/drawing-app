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
    pixelDensity: 1,
  }

  constructor(canvas: HTMLCanvasElement, pixelDensity = 1) {
    super(canvas, (gl) => ({
      lineDrawing: new LineDrawingProgram(gl, pixelDensity),
    }))

    this.context.pixelDensity = pixelDensity
  }

  public updateDrawing() {
    if (this.context.currentPath.points.length > 0) {
      this.drawLine(this.context.currentPath.points, { drawType: DrawType.DYNAMIC_DRAW })
    }
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

  public addPosition(position: Readonly<Vec2>) {
    if (this.context.isDrawing) {
      this.context.currentPath.add(position)
    }
    this.updateDrawing()
  }
}
