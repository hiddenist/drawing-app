import { IBaseProgram } from "@libs/shared"

export abstract class BaseDrawingEngine<
  Programs extends Record<never, IBaseProgram>,
  ProgramKeys extends keyof Programs = keyof Programs,
> {
  protected baseLayer: WebGLRenderingContext
  protected currentProgram?: IBaseProgram
  private programs: Programs

  constructor(canvas: HTMLCanvasElement, programs: (gl: WebGLRenderingContext) => Programs) {
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })
    if (!gl) {
      throw new Error("WebGL not supported")
    }
    this.baseLayer = gl
    this.programs = programs(gl)
  }

  protected getProgram<T extends ProgramKeys>(name: T): Programs[T] {
    const program = this.programs[name]
    const asBaseProgram = program as IBaseProgram
    this.currentProgram = asBaseProgram
    asBaseProgram.useProgram()
    return program
  }
}
