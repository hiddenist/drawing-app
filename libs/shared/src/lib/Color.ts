import { VectorArray } from "../types/arrays"

export class Color {
  static readonly BLACK = new Color(0, 0, 0)
  static readonly WHITE = new Color(255, 255, 255)
  static readonly TRANSPARENT = new Color(0, 0, 0, 0)
  private vector: Uint8ClampedArray

  public constructor(vector: Readonly<Uint8ClampedArray>, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<VectorArray<3>>, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<VectorArray<4>>, _?: never, __?: never, ___?: never)
  public constructor(
    /** Red as an 8 bit number (0 to 255) */
    r: number,
    /** Green as an 8 bit number (0 to 255) */
    g: number,
    /** Blue as an 8 bit number (0 to 255) */
    b: number,
    /** Alpha as an 8 bit number (0 to 255). Defaults to 255. */
    a?: number,
  )
  public constructor(
    redOrVector: Readonly<VectorArray<3>> | Readonly<VectorArray<4>> | Readonly<Uint8ClampedArray> | number,
    g: typeof redOrVector extends number ? number : never,
    b: typeof redOrVector extends number ? number : never,
    a?: typeof redOrVector extends number ? number | undefined : never,
  ) {
    if (redOrVector instanceof Uint8ClampedArray) {
      this.vector = redOrVector.copyWithin(4, 0, 3)
      if (redOrVector.length < 4) this.vector[3] = 255
      return
    }

    this.vector = new Uint8ClampedArray(4)

    if (typeof redOrVector === "number") {
      this.vector[0] = redOrVector
      this.vector[1] = g ?? 0
      this.vector[2] = b ?? 0
      this.vector[3] = a ?? 255
      return
    }

    this.vector[0] = redOrVector[0]
    this.vector[1] = redOrVector[1]
    this.vector[2] = redOrVector[2]
    this.vector[3] = redOrVector[3] ?? 255
  }

  get vec4(): Readonly<Uint8ClampedArray> {
    return this.vector
  }

  public copy(): Color {
    return new Color(this.vector)
  }

  public static from(color: string | Color): Color {
    if (color instanceof Color) return color.copy()
    if (color.startsWith("#")) return Color.fromHex(color)
    if (color.startsWith("rgba(")) return Color.fromRgba(color)
    if (color.startsWith("rgb(")) return Color.fromRgb(color)
    throw new Error("Invalid format for color string")
  }

  public static fromHex(hex: string): Color {
    if (hex.length === 4) {
      const [r, g, b] = hex
        .slice(1)
        .split("")
        .map((c) => parseInt(c + c, 16))
      return new Color(r, g, b)
    }

    const [r, g, b] = hex
      .slice(1)
      .match(/.{2}/g)!
      .map((c) => parseInt(c, 16))
    return new Color(r, g, b)
  }

  public static fromRgb(rgb: string): Color {
    const [r, g, b] = rgb
      .slice(4, -1)
      .split(",")
      .map((c) => parseInt(c))
    return new Color(r, g, b)
  }

  public static fromRgba<T extends string = `rgba(${number}, ${number}, ${number}, ${number})`>(rgba: T): Color {
    const [r, g, b, a] = rgba
      .slice(5, -1)
      .split(",")
      .map((c) => parseInt(c))
    return new Color(r, g, b, a)
  }

  /*
   * Red as an 8 bit number (0 to 255).
   */
  get r(): number {
    return this.vector[0]
  }
  /**
   * Green as an 8 bit number (0 to 255).
   */
  get g(): number {
    return this.vector[1]
  }
  /**
   * Blue as an 8 bit number (0 to 255).
   */
  get b(): number {
    return this.vector[2]
  }
  /**
   * Alpha as an 8 bit number (0 to 255).
   */
  get a(): number {
    return this.vector[3]
  }

  get rgb(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }
  get rgba(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`
  }
  get hex(): string {
    return `#${this.r.toString(16)}${this.g.toString(16)}${this.b.toString(16)}`
  }
}
