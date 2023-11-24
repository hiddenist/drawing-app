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
    if (r < 0 || r > 255) {
      throw new Error("Out of bounds: Red must be between 0 and 255")
    }
    if (g < 0 || g > 255) {
      throw new Error("Out of bounds: Green must be between 0 and 255")
    }
    if (b < 0 || b > 255) {
      throw new Error("Out of bounds: Blue must be between 0 and 255")
    }
    if (a < 0 || a > 100) {
      throw new Error("Out of bounds: Alpha channel must be between 0 and 100")
    }
  }

  public toVector4(): VectorArray<4> {
    return [this.r / 255, this.g / 255, this.b / 255, this.a / 100]
  }
}
