import { BaseProgram, Color } from "@libs/shared"
import { DrawingEngine, DrawingEngineEvent, EventType } from "../engine/DrawingEngine"
import { InputPoint } from "./InputPoint"
import { ToolNames } from "./Tools"

export type EyeDropperInfo = {
  tool: "eyedropper"
  color: Readonly<Color>
  previousColor: Readonly<Color>
}

export class EyeDropperTool {
  public readonly updatesImageData = false
  public static readonly TOOL_NAME = ToolNames.eyedropper
  public readonly toolName = EyeDropperTool.TOOL_NAME
  constructor(public readonly engine: DrawingEngine) {
    this.engine = engine

    const listeners = {
      press: this.onPress.bind(this),
      move: this.onMove.bind(this),
      release: this.onRelease.bind(this),
      cancel: this.onCancel.bind(this),
    }

    this.engine.addListener(EventType.changeTool, ({ tool }) => {
      if (tool === this.toolName) {
        this.engine.addListener(EventType.press, listeners.press)
        this.engine.addListener(EventType.move, listeners.move)
        this.engine.addListener(EventType.release, listeners.release)
        this.engine.addListener(EventType.cancel, listeners.cancel)
      } else {
        this.engine.removeListener(EventType.press, listeners.press)
        this.engine.removeListener(EventType.move, listeners.move)
        this.engine.removeListener(EventType.release, listeners.release)
        this.engine.removeListener(EventType.cancel, listeners.cancel)
      }
    })
  }

  onCancel() {
    if (this.engine.getState().prevTool === ToolNames.eraser) {
      this.engine.setTool(ToolNames.brush)
    } else {
      this.engine.usePrevTool()
    }
    this.engine.callListeners(EventType.previewColor, { color: null })
  }

  onPress({ position }: DrawingEngineEvent<EventType.press>) {
    this.pickColor(position)
  }

  onMove({ positions }: DrawingEngineEvent<EventType.move>) {
    const [x, y] = positions[positions.length - 1] ?? [0, 0]
    const color = BaseProgram.getColorAtPosition(this.engine.gl, [x, y])
    if (!color) {
      return
    }
    this.engine.callListeners(EventType.previewColor, { color })
  }

  onRelease({ position }: DrawingEngineEvent<EventType.release>) {
    if (this.pickColor(position)) {
      this.engine.usePrevTool()
    } else {
      this.onCancel()
    }
  }

  protected pickColor([x, y]: Readonly<InputPoint>) {
    const color = BaseProgram.getColorAtPosition(this.engine.gl, [x, y])
    if (!color) {
      return false
    }
    this.engine.setColor(color)
    this.engine.callListeners(EventType.pickColor, { color })
    return true
  }
}
