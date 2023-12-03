import { VectorArray } from "../types/arrays"

export type RbgArray = [
  /** Red as an 8 bit number (0 to 255) */
  red: number,
  /** Green as an 8 bit number (0 to 255) */
  green: number,
  /** Blue as an 8 bit number (0 to 255) */
  blue: number,
]
export type HslArray = [
  /** Hue as a degree (0 to 360) */
  hue: number,
  /** Saturation as a percentage (0 to 100) */
  saturation: number,
  /** Lightness as a percentage (0 to 100) */
  lightness: number,
]

export class Color {
  static readonly BLACK = new Color(0, 0, 0)
  static readonly WHITE = new Color(255, 255, 255)
  private vector: Uint8ClampedArray

  public constructor(colorString: string, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<Uint8ClampedArray>, _?: never, __?: never, ___?: never)
  public constructor(vector: Readonly<RbgArray>, _?: never, __?: never, ___?: never)
  public constructor(
    /** Red as an 8 bit number (0 to 255) */
    red: number,
    /** Green as an 8 bit number (0 to 255) */
    green: number,
    /** Blue as an 8 bit number (0 to 255) */
    blue: number,
  )
  public constructor(
    firstParam: Readonly<VectorArray<3 | 4>> | Readonly<Uint8ClampedArray> | number | string,
    g: typeof firstParam extends number ? number : never,
    b: typeof firstParam extends number ? number : never,
  ) {
    if (firstParam instanceof Uint8ClampedArray) {
      const vector = firstParam
      this.vector = vector.copyWithin(4, 0, 3)
      return
    }

    this.vector = new Uint8ClampedArray(3)

    if (typeof firstParam === "number") {
      const r = firstParam
      this.vector[0] = r
      this.vector[1] = g ?? 0
      this.vector[2] = b ?? 0
      return
    }

    if (typeof firstParam === "string") {
      const color: RbgArray = Color.fromString(firstParam)
      this.vector[0] = color[0]
      this.vector[1] = color[1]
      this.vector[2] = color[2]
      return
    }

    if (Array.isArray(firstParam)) {
      this.vector[0] = firstParam[0]
      this.vector[1] = firstParam[1]
      this.vector[2] = firstParam[2]
    }

    throw new Error("Invalid color parameters")
  }

  get vec3(): Readonly<Uint8ClampedArray> {
    return this.vector
  }

  public copy(): Color {
    return new Color(this.vector)
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

  get rgb(): string {
    return `rgb(${this.r}, ${this.g}, ${this.b})`
  }

  get rgba(): string {
    return this.getRgba()
  }

  public getRgba(alphaPercent = 100): string {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${alphaPercent / 100})`
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
    return this.getHsla()
  }

  public getHsla(alphaPercent = 100): string {
    const [h, s, l] = this.getHslaValues()
    return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${alphaPercent / 100})`
  }

  public toString(): string {
    return this.rgb
  }

  /**
   * @param precision The number of decimal places to round to.
   * @returns An array of HSLA values.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   */
  public getHslaValues(): HslArray {
    const redPercent = this.r / 255
    const greenPercent = this.g / 255
    const bluePercent = this.b / 255

    const max = Math.max(redPercent, greenPercent, bluePercent)
    const min = Math.min(redPercent, greenPercent, bluePercent)
    const lightness = (max + min) / 2

    if (max === min) return [0, 0, lightness * 100]

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

    return [hue, saturation * 100, lightness * 100]
  }

  public equals(color: Color): boolean {
    if (color.vector.length !== this.vector.length) return false
    for (let i = 0; i < this.vector.length; i++) {
      if (color.vector[i] !== this.vector[i]) return false
    }
    return true
  }

  protected static fromString(color: string): RbgArray {
    if (color.startsWith("#")) return Color.fromHex(color)
    if (color.startsWith("rgb(")) return Color.fromRgb(color)
    if (color.startsWith("rgba(")) return Color.fromRgba(color)
    if (color.startsWith("hsl(")) return Color.fromHsl(color)
    if (color.startsWith("hsla(")) return Color.fromHsla(color)
    throw new Error("Invalid color string")
  }

  protected static fromHex(hex: string): RbgArray {
    if (hex.length === 4) {
      const fullHex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      return this.fromHex(fullHex)
    }

    const [r, g, b] = hex
      .slice(1)
      .match(/.{2}/g)!
      .map((c) => parseInt(c, 16))
    return [r, g, b]
  }

  protected static fromRgb(rgb: string): RbgArray {
    const [r, g, b] = rgb
      .slice(4, -1)
      .split(",")
      .map((c) => parseInt(c.trim()))
    return [r, g, b]
  }

  protected static fromRgba(rgba: string): RbgArray {
    const sliced = rgba
      .slice(5, -1)
      .split(",")
      .map((s) => s.trim())
    const [r, g, b] = sliced.map((c) => parseInt(c))
    return [r, g, b]
  }

  protected static fromHsl(hsl: string): RbgArray {
    const [h, s, l] = hsl
      .slice(4, -1)
      .split(",")
      .map((c) => parseInt(c.trim()))
    return Color.fromHslValues(h, s, l)
  }

  protected static fromHsla(hsla: string): RbgArray {
    const sliced = hsla
      .slice(5, -1)
      .split(",")
      .map((s) => s.trim())
    const [h, s, l] = sliced.map((c) => parseInt(c))
    return Color.fromHslValues(h, s, l)
  }

  protected static fromHslValues(h: number, s: number, l: number): RbgArray {
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

    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)]
  }
}
