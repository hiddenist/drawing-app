import { InputPoint } from "./InputPoint"
import { DrawLineOptions, LineDrawingProgram } from "../programs/LineDrawingProgram"
import { DrawingEngine, DrawingEngineEvent, EventType } from "../engine/DrawingEngine"
import { ToolName } from "./Tools"

export type LineDrawInfo = {
  tool: ToolName
  path: InputPoint[]
  options: Required<Omit<DrawLineOptions, "drawType">>
}

export class LineTool {
  public readonly updatesImageData = true
  private currentPath: InputPoint[] = []
  private options = {
    pressureEnabled: true,
    lineWeight: 5,
  }

  constructor(
    protected readonly engine: DrawingEngine,
    protected readonly program: LineDrawingProgram,
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
    this.addPosition(position)
    this.draw()
    return { hideCursor: true }
  }

  protected onMove({ positions, isPressed }: DrawingEngineEvent<EventType.move>) {
    if (isPressed) {
      this.addPositions(positions)
      this.draw()
    }
  }

  protected onRelease({ position }: DrawingEngineEvent<EventType.release>) {
    this.addPosition(position)
    this.draw()
    this.commit()
  }

  protected onCancel() {
    this.currentPath = []
  }

  protected onChangeTool() {
    this.commit()
  }

  protected commit() {
    if (this.currentPath.length < 2) {
      return
    }
    this.engine.commitToSavedLayer()
    this.engine.addHistory(this.getToolInfo())
    this.currentPath = []
  }

  private getToolInfo(): LineDrawInfo {
    return {
      path: structuredClone(this.currentPath),
      options: this.getLineOptions(),
      tool: this.toolName,
    }
  }

  private draw() {
    if (this.currentPath.length < 2) {
      return
    }
    const path = this.currentPath
    this.engine.draw(() => {
      const pressure = this.options.pressureEnabled ? path.map(([, , pressure]) => pressure ?? 0.0) : undefined
      this.program.draw(
        {
          points: path.map(([x, y]) => [x, y]).flat(),
          pressure: pressure && this.hasPressure(pressure) ? pressure : undefined,
        },
        this.getLineOptions(),
      )
      return this.getToolInfo()
    })
  }

  private hasPressure(points: number[]) {
    return points.some((point) => point !== 0)
  }

  protected getLineOptions(): Required<Omit<DrawLineOptions, "drawType">> {
    return {
      color: this.engine.getCurrentColor(),
      opacity: this.engine.getOpacity(),
      diameter: this.options.lineWeight,
    }
  }

  private addPosition(position: Readonly<InputPoint>) {
    this.addPositions([[...position]])
  }

  private addPositions(positions: ReadonlyArray<InputPoint>) {
    this.currentPath.push(...positions)
  }
}
