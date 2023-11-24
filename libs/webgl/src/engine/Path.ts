import { VectorArray } from "../types/arrays"

export class Path {
  protected _points: number[] = []

  public get points(): Readonly<number[]> {
    return this._points
  }

  public set points(path: ReadonlyArray<VectorArray<2> | number>) {
    this._points.splice(0, this._points.length, ...path.flat())
  }

  public add(path: Readonly<number[]>): Readonly<number[]> {
    this._points.push(...path)
    return this.points
  }

  public clear(): number[] {
    const path = [...this._points]
    this._points.splice(0, this._points.length)
    return path
  }
}
