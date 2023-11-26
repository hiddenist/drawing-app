import { VectorArray } from "../types/arrays"

export type RbgaArray = [
  /** Red as an 8 bit number (0 to 255) */
  red: number,
  /** Green as an 8 bit number (0 to 255) */
  green: number,
  /** Blue as an 8 bit number (0 to 255) */
  blue: number,
  /** Alpha as an 8 bit number (0 to 255) */
  alpha: number,
]
export type HslaArray = [
  /** Hue as a degree (0 to 360) */
  hue: number,
  /** Saturation as a percentage (0 to 100) */
  saturation: number,
  /** Lightness as a percentage (0 to 100) */
  lightness: number,
  /** Alpha as a percentage (0 to 1) */
  alpha: number,
]

export class Color {
  static readonly BLACK = new Color(0, 0, 0)
  static readonly WHITE = new Color(255, 255, 255)
  static readonly TRANSPARENT = new Color(0, 0, 0, 0)
  private vector: Uint8ClampedArray

  public constructor(colorString: string, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<Uint8ClampedArray>, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<VectorArray<3 | 4>>, _?: never, __?: never, ___?: never)
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
    firstParam: Readonly<VectorArray<3 | 4>> | Readonly<Uint8ClampedArray> | number | string,
    g: typeof firstParam extends number ? number : never,
    b: typeof firstParam extends number ? number : never,
    a?: typeof firstParam extends number ? number | undefined : never,
  ) {
    if (firstParam instanceof Uint8ClampedArray) {
      const vector = firstParam
      this.vector = vector.copyWithin(4, 0, 3)
      if (vector.length < 4) this.vector[3] = 255
      return
    }

    this.vector = new Uint8ClampedArray(4)

    if (typeof firstParam === "number") {
      const r = firstParam
      this.vector[0] = r
      this.vector[1] = g ?? 0
      this.vector[2] = b ?? 0
      this.vector[3] = a ?? 255
      return
    }

    if (typeof firstParam === "string") {
      const color: RbgaArray = Color.fromString(firstParam)
      this.vector[0] = color[0]
      this.vector[1] = color[1]
      this.vector[2] = color[2]
      this.vector[3] = color[3]
      return
    }

    if (Array.isArray(firstParam)) {
      this.vector[0] = firstParam[0]
      this.vector[1] = firstParam[1]
      this.vector[2] = firstParam[2]
      this.vector[3] = firstParam[3] ?? 255
    }

    throw new Error("Invalid color parameters")
  }

  get vec4(): Readonly<Uint8ClampedArray> {
    return this.vector
  }

  public copy(): Color {
    return new Color(this.vector)
  }

  protected static from(color: Color): Color {
    if (color instanceof Color) return color.copy()
    throw new Error("Invalid color object")
  }

  protected static fromString(color: string): RbgaArray {
    if (color.startsWith("#")) return Color.fromHex(color)
    if (color.startsWith("rgb(")) return Color.fromRgb(color)
    if (color.startsWith("rgba(")) return Color.fromRgba(color)
    if (color.startsWith("hsl(")) return Color.fromHsl(color)
    if (color.startsWith("hsla(")) return Color.fromHsla(color)
    throw new Error("Invalid color string")
  }

  protected static fromHex(hex: string): RbgaArray {
    if (hex.length === 4) {
      const fullHex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      return this.fromHex(fullHex)
    }

    const [r, g, b] = hex
      .slice(1)
      .match(/.{2}/g)!
      .map((c) => parseInt(c, 16))
    return [r, g, b, 255]
  }

  protected static fromRgb(rgb: string): RbgaArray {
    const [r, g, b] = rgb
      .slice(4, -1)
      .split(",")
      .map((c) => parseInt(c.trim()))
    return [r, g, b, 255]
  }

  protected static fromRgba(rgba: string): RbgaArray {
    const sliced = rgba
      .slice(5, -1)
      .split(",")
      .map((s) => s.trim())
    const [r, g, b] = sliced.map((c) => parseInt(c))
    const a = Color.parseAlphaString(sliced[3])
    return [r, g, b, a * 255]
  }

  protected static fromHsl(hsl: string): RbgaArray {
    const [h, s, l] = hsl
      .slice(4, -1)
      .split(",")
      .map((c) => parseInt(c.trim()))
    return Color.fromHslaValues(h, s, l)
  }

  protected static fromHsla(hsla: string): RbgaArray {
    const sliced = hsla
      .slice(5, -1)
      .split(",")
      .map((s) => s.trim())
    const [h, s, l] = sliced.map((c) => parseInt(c))
    return Color.fromHslaValues(h, s, l, parseFloat(sliced[3]))
  }

  protected static parseAlphaString(alpha: string): number {
    if (alpha.endsWith("%")) return parseFloat(alpha) / 100
    return parseFloat(alpha)
  }

  protected static fromHslaValues(h: number, s: number, l: number, a = 1): RbgaArray {
    const hue = h / 360
    const saturation = s / 100
    const lightness = l / 100

    let red = lightness
    let green = lightness
    let blue = lightness

    if (saturation !== 0) {
      const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
      const p = 2 * lightness - q

      const hueToColorValue = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      red = hueToColorValue(p, q, hue + 1 / 3)
      green = hueToColorValue(p, q, hue)
      blue = hueToColorValue(p, q, hue - 1 / 3)
    }

    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255), a * 255]
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
  /**
   * Alpha as an integer from 0 to 100.
   */
  get alphaPercent(): number {
    return Math.round((this.a / 255) * 100)
  }

  get rgb(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }
  get rgba(): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.alphaPercent / 100})`
  }
  get hex(): string {
    const toHex = (n: number): string => n.toString(16).padStart(2, "0")
    return `#${toHex(this.r)}${toHex(this.g)}${toHex(this.b)}`
  }
  get hsl(): string {
    const [h, s, l] = this.getHslaValues()
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
  }
  get hsla(): string {
    const [h, s, l, a] = this.getHslaValues()
    return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`
  }

  public toString(): string {
    return this.rgba
  }

  /**
   * @param precision The number of decimal places to round to.
   * @returns An array of HSLA values.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   */
  public getHslaValues(): HslaArray {
    const redPercent = this.r / 255
    const greenPercent = this.g / 255
    const bluePercent = this.b / 255

    const max = Math.max(redPercent, greenPercent, bluePercent)
    const min = Math.min(redPercent, greenPercent, bluePercent)
    const lightness = (max + min) / 2

    if (max === min) return [0, 0, lightness * 100, this.a / 255]

    const delta = max - min
    let hue = 0
    switch (max) {
      case redPercent:
        hue = ((greenPercent - bluePercent) / delta) % 6
        break
      case greenPercent:
        hue = (bluePercent - redPercent) / delta + 2
        break
      case bluePercent:
        hue = (redPercent - greenPercent) / delta + 4
        break
    }
    hue *= 60
    if (hue < 0) {
      hue += 360
    }

    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    return [hue, saturation * 100, lightness * 100, this.a / 255]
  }

  public equals(color: Color): boolean {
    if (color.vector.length !== this.vector.length) return false
    for (let i = 0; i < this.vector.length; i++) {
      if (color.vector[i] !== this.vector[i]) return false
    }
    return true
  }
}
