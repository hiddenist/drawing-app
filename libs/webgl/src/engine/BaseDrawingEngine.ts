import { BaseProgram } from "../programs/BaseProgram"

export abstract class BaseDrawingEngine<
  Programs extends Record<never, BaseProgram>,
  ProgramKeys extends keyof Programs = keyof Programs,
> {
  protected gl: WebGLRenderingContext
  protected currentProgram?: BaseProgram
  private programs: Programs

  constructor(canvas: HTMLCanvasElement, programs: (gl: WebGLRenderingContext) => Programs) {
    const gl = canvas.getContext("webgl")
    if (!gl) {
      throw new Error("WebGL not supported")
    }
    this.gl = gl
    this.programs = programs(gl)
  }

  protected getProgram<T extends ProgramKeys>(name: T): Programs[T] {
    const program = this.programs[name]
    const asBaseProgram = program as BaseProgram
    if (this.currentProgram !== program) {
      asBaseProgram.useProgram()
      this.currentProgram = asBaseProgram
    }
    return program
  }
}
