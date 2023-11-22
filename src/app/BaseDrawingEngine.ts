import { BaseProgram } from "../programs/BaseProgram"

export abstract class BaseDrawingEngine<
  Programs extends Record<never, BaseProgram>,
  ProgramKeys extends keyof Programs = keyof Programs
> {
  protected gl: WebGLRenderingContext
  protected currentProgram?: BaseProgram
  protected abstract programs: Programs

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl")
    if (!gl) {
      throw new Error("WebGL not supported")
    }
    this.gl = gl
  }

  protected getProgram<T extends ProgramKeys>(name: T): Programs[T] {
    return this.programs[name]
  }

  protected switchProgram<T extends ProgramKeys>(name: T): Programs[T] {
    const program = this.getProgram(name)
    const asBaseProgram = program as BaseProgram
    if (this.currentProgram !== program) {
      asBaseProgram.useProgram()
      this.currentProgram = asBaseProgram
    }
    return program
  }
}
