import { VectorArray } from "../types/arrays"

export class LineContext {
  protected points: VectorArray<2>[] = []

  public get currentSegment(): VectorArray<2>[] {
    return this.points
  }

  public get flat(): number[] {
    return this.points.flat()
  }

  public addPoint(point: VectorArray<2>) {
    this.points.push(point)
  }

  public clearCurrentSegment() {
    this.points = []
  }
}
