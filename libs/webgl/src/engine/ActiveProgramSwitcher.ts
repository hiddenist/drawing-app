import { IBaseProgram } from "@libs/shared"

export class ActiveProgramSwitcher<
  Programs extends Record<never, IBaseProgram>,
  ProgramKeys extends keyof Programs = keyof Programs,
> {
  protected currentProgram?: IBaseProgram

  constructor(private programs: Programs) {}

  public getProgram<T extends ProgramKeys>(name: T): Programs[T] {
    const program = this.programs[name]
    const asBaseProgram = program as IBaseProgram
    this.currentProgram = asBaseProgram
    asBaseProgram.useProgram()
    return program
  }
}
