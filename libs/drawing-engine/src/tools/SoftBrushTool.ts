import { InputPoint } from "./InputPoint"
import { SoftBrushProgram, SoftBrushOptions, StrokePoint } from "../programs/SoftBrushProgram"
import { DrawingEngine, DrawingEngineEvent, EventType } from "../engine/DrawingEngine"
import { ToolName } from "./Tools"

export type SoftBrushDrawInfo = {
  tool: ToolName
  strokePoints: StrokePoint[]
  options: Required<SoftBrushOptions>
}

export class SoftBrushTool {
  public readonly updatesImageData = true
  private currentStroke: StrokePoint[] = []
  private options = {
    lineWeight: 50,
    hardness: 0.0, // 0 = softest, 1 = hardest
    flow: 0.15, // Lower flow for more gradual buildup
  }

  constructor(
    protected readonly engine: DrawingEngine,
    protected readonly program: SoftBrushProgram,
    public readonly toolName: ToolName,
  ) {
    this.setupListeners()
  }

  public setLineWeight(lineWeight: number) {
    this.options.lineWeight = lineWeight
  }

  public getLineWeight() {
    return this.options.lineWeight
  }

  public setHardness(hardness: number) {
    this.options.hardness = Math.max(0.0, Math.min(1.0, hardness))
  }

  public getHardness() {
    return this.options.hardness
  }

  public setFlow(flow: number) {
    this.options.flow = Math.max(0.0, Math.min(1.0, flow))
  }

  public getFlow() {
    return this.options.flow
  }

  protected setupListeners() {
    const listeners = {
      press: this.onPress.bind(this),
      move: this.onMove.bind(this),
      release: this.onRelease.bind(this),
      cancel: this.onCancel.bind(this),
      changeTool: this.onChangeTool.bind(this),
    }

    this.engine.addListener(EventType.changeTool, ({ tool }) => {
      if (tool === this.toolName) {
        this.engine.addListener(EventType.press, listeners.press)
        this.engine.addListener(EventType.move, listeners.move)
        this.engine.addListener(EventType.release, listeners.release)
        this.engine.addListener(EventType.cancel, listeners.cancel)
        this.engine.addListener(EventType.changeTool, listeners.changeTool)
      } else {
        this.engine.removeListener(EventType.press, listeners.press)
        this.engine.removeListener(EventType.move, listeners.move)
        this.engine.removeListener(EventType.release, listeners.release)
        this.engine.removeListener(EventType.cancel, listeners.cancel)
        this.engine.removeListener(EventType.changeTool, listeners.changeTool)
      }
    })
  }

  protected onPress({ position }: DrawingEngineEvent<EventType.press>) {
    this.addStrokePoint(position)
    this.draw()
    return { hideCursor: true }
  }

  protected onMove({ positions, isPressed }: DrawingEngineEvent<EventType.move>) {
    if (isPressed) {
      this.addStrokePoints(positions)
      this.draw()
    }
  }

  protected onRelease({ position }: DrawingEngineEvent<EventType.release>) {
    this.addStrokePoint(position)
    this.draw()
    this.commit()
  }

  protected onCancel() {
    this.currentStroke = []
  }

  protected onChangeTool() {
    this.commit()
  }

  protected commit() {
    if (this.currentStroke.length < 1) {
      return
    }
    this.engine.commitToSavedLayer()
    this.engine.addHistory(this.getToolInfo())
    this.currentStroke = []
  }

  private getToolInfo(): SoftBrushDrawInfo {
    return {
      strokePoints: structuredClone(this.currentStroke),
      options: this.getSoftBrushOptions(),
      tool: this.toolName,
    }
  }

  private draw() {
    if (this.currentStroke.length < 1) {
      return
    }

    this.engine.draw(() => {
      this.program.drawStroke(this.currentStroke, this.getSoftBrushOptions())
      return this.getToolInfo()
    })
  }

  protected getSoftBrushOptions(): Required<SoftBrushOptions> {
    return {
      color: this.engine.getCurrentColor(),
      opacity: this.engine.getOpacity(), // Pass raw 0-255 value, shader will convert
    }
  }

  public drawFromHistory(strokePoints: SoftBrushDrawInfo["strokePoints"], options: SoftBrushDrawInfo["options"]) {
    if (strokePoints.length < 1) {
      return
    }

    try {
      this.program.drawStroke(strokePoints, options)
    } catch (error) {
      console.error("Error in SoftBrushTool.drawFromHistory:", error)
    }
  }

  private addStrokePoint(position: Readonly<InputPoint>) {
    const [x, y, pressure = 1.0] = position
    const strokePoint: StrokePoint = {
      x,
      y,
      radius: (this.options.lineWeight * pressure) / 2,
      hardness: this.options.hardness,
      flow: this.options.flow,
    }
    this.currentStroke.push(strokePoint)
  }

  private addStrokePoints(positions: ReadonlyArray<InputPoint>) {
    positions.forEach((position) => this.addStrokePoint(position))
  }
}
