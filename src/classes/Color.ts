import type { VectorArray } from "../types/arrays"

export class Color {
  static readonly BLACK = new Color(0, 0, 0)
  static readonly WHITE = new Color(255, 255, 255)
  static readonly TRANSPARENT = new Color(0, 0, 0, 0)

  public constructor(
    /** Red as an 32-byte number (0 to 255) */
    public readonly r: number,
    /** Green as an 32-byte number (0 to 255) */
    public readonly g: number,
    /** Blue as an 32-byte number (0 to 255) */
    public readonly b: number,
    /** Alpha as a 0-100 percentage. Defaults to 100. */
    public readonly a = 100,
  ) {
    this.r = r > 255 ? 255 : r < 0 ? 0 : r
    this.g = g > 255 ? 255 : g < 0 ? 0 : g
    this.b = b > 255 ? 255 : b < 0 ? 0 : b
    this.a = a > 100 ? 100 : a < 0 ? 0 : a
  }

  public toVector4(): VectorArray<4> {
    return [this.r / 255, this.g / 255, this.b / 255, this.a / 100]
  }
}
