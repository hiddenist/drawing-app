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
  options: Required<Omit<DrawLineOptions, "drawType">>
}

export class DrawingEngine extends BaseDrawingEngine<AvailablePrograms> {
  protected context = {
    color: new ColorContext(),
    currentPath: new Path(),
    pathHistory: [] as Array<HistoryItem>,
    lineWeight: 5,
    isDrawing: false,
    pixelDensity: 1,
  }
  protected activeDrawingLayer: WebGLRenderingContext

  constructor(canvas: HTMLCanvasElement, pixelDensity = 1) {
    super(canvas, (gl) => ({
      lineDrawing: new LineDrawingProgram(gl, pixelDensity),
    }))

    this.context.pixelDensity = pixelDensity
    this.activeDrawingLayer = this.cloneContext({ preserveDrawingBuffer: false })
  }

  protected cloneContext(options?: WebGLContextAttributes) {
    const baseCanvas = this.baseLayer.canvas
    if (!(baseCanvas instanceof HTMLCanvasElement)) {
      throw new Error("canvas needs to be an active HTMLCanvasElement")
    }
    const canvas = document.createElement("canvas")
    baseCanvas.parentElement?.appendChild(canvas)
    canvas.width = baseCanvas.width
    canvas.height = baseCanvas.height
    canvas.style.width = `${canvas.width / this.context.pixelDensity}px`
    canvas.style.height = `${canvas.height / this.context.pixelDensity}px`
    canvas.style.position = "absolute"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.pointerEvents = "none"
    const context = canvas.getContext("webgl", options)
    if (!context) {
      throw new Error("Unable to get WebGL context")
    }
    return context
  }

  public updateDrawing() {
    if (this.context.currentPath.points.length > 0) {
      this.drawLine(this.context.currentPath.points, { drawType: DrawType.DYNAMIC_DRAW, thickness: this.lineWeight })
    }
  }

  public drawLine(
    points: ReadonlyArray<number>,
    { color = this.color.foreground, thickness = this.lineWeight, drawType }: Partial<DrawLineOptions> = {},
  ) {
    if (points.length === 2) {
      points = [...points, ...points.map((p) => p + 1)]
    }
    this.getProgram("lineDrawing").drawLine(points, {
      drawType,
      thickness: thickness * this.context.pixelDensity,
      color,
    })
  }

  private get color(): ColorContext {
    return this.context.color
  }

  public setColor(color: Color) {
    this.color.setForeground(color)
  }

  public get lineWeight(): number {
    return this.context.lineWeight
  }

  public setLineWeight(weight: number): typeof this {
    this.context.lineWeight = weight
    return this
  }

  public getCurrentColor() {
    return this.color.foreground
  }

  public clearCanvas() {
    this.baseLayer.clearColor(0, 0, 0, 0)
    this.baseLayer.clear(this.baseLayer.COLOR_BUFFER_BIT)
  }

  public setPressed(pressed: boolean, position: Readonly<Vec2>) {
    this.context.isDrawing = pressed
    if (pressed) {
      this.getProgram("lineDrawing").gl = this.activeDrawingLayer
      this.context.currentPath.add(position)
      this.updateDrawing()
    } else {
      this.activeDrawingLayer.clearColor(0, 0, 0, 0)
      this.getProgram("lineDrawing").gl = this.baseLayer
      this.commitPath(this.context.currentPath.clear())
    }
  }

  protected commitPath(path: ReadonlyArray<number>) {
    if (path.length === 0) {
      return
    }
    const options = {
      color: this.color.foreground,
      thickness: this.lineWeight,
    }
    this.drawLine(path, { drawType: DrawType.STATIC_DRAW, ...options })
    this.context.pathHistory.push({
      path,
      options,
    })
  }

  public addPosition(position: Readonly<Vec2>) {
    if (this.context.isDrawing) {
      this.context.currentPath.add(position)
    }
    this.updateDrawing()
  }
}
