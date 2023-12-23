import { BaseProgram, Color } from "@libs/shared"
import { DrawingEngine, DrawingEngineEvent } from "../engine/DrawingEngine"
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

    this.engine.addListener("changeTool", ({ tool }) => {
      if (tool === this.toolName) {
        this.engine.addListener("press", listeners.press)
        this.engine.addListener("move", listeners.move)
        this.engine.addListener("release", listeners.release)
        this.engine.addListener("cancel", listeners.cancel)
      } else {
        this.engine.removeListener("press", listeners.press)
        this.engine.removeListener("move", listeners.move)
        this.engine.removeListener("release", listeners.release)
        this.engine.removeListener("cancel", listeners.cancel)
      }
    })
  }

  onCancel() {
    this.engine.usePrevTool()
    this.engine.callListeners("previewColor", { color: null })
  }

  onPress({ position }: DrawingEngineEvent<"press">) {
    this.pickColor(position)
  }

  onMove({ positions }: DrawingEngineEvent<"move">) {
    const [x, y] = positions[positions.length - 1] ?? [0, 0]
    const color = BaseProgram.getColorAtPosition(this.engine.gl, [x, y])
    if (!color) {
      return
    }
    this.engine.callListeners("previewColor", { color })
  }

  onRelease({ position }: DrawingEngineEvent<"release">) {
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
    this.engine.callListeners("pickColor", { color })
    return true
  }
}
