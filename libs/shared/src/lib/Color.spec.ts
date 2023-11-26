import { Color } from "./Color"
import { it, describe, expect } from "vitest"

const testData: ReadonlyArray<{
  colorName: string
  colorObject: Color
  rgbaArray: [number, number, number, number]
  hslaArray: [number, number, number, number]
  rgbString: string
  rgbaString: string
  hexString: string
  hslString: string
  hslaString: string
}> = [
  {
    colorName: "Black",
    colorObject: Color.BLACK,
    rgbaArray: [0, 0, 0, 255],
    rgbString: "rgb(0, 0, 0)",
    rgbaString: "rgba(0, 0, 0, 1)",
    hexString: "#000000",
    hslString: "hsl(0, 0%, 0%)",
    hslaArray: [0, 0, 0, 1],
    hslaString: "hsla(0, 0%, 0%, 1)",
  },
  {
    colorName: "White",
    colorObject: Color.WHITE,
    rgbaArray: [255, 255, 255, 255],
    rgbString: "rgb(255, 255, 255)",
    rgbaString: "rgba(255, 255, 255, 1)",
    hexString: "#ffffff",
    hslString: "hsl(0, 0%, 100%)",
    hslaArray: [0, 0, 100, 1],
    hslaString: "hsla(0, 0%, 100%, 1)",
  },
  {
    colorName: "Red",
    colorObject: new Color(255, 0, 0),
    rgbaArray: [255, 0, 0, 255],
    rgbString: "rgb(255, 0, 0)",
    rgbaString: "rgba(255, 0, 0, 1)",
    hexString: "#ff0000",
    hslString: "hsl(0, 100%, 50%)",
    hslaArray: [0, 100, 50, 1],
    hslaString: "hsla(0, 100%, 50%, 1)",
  },
  {
    colorName: "Orange",
    colorObject: new Color(255, 165, 0),
    rgbaArray: [255, 165, 0, 255],
    rgbString: "rgb(255, 165, 0)",
    rgbaString: "rgba(255, 165, 0, 1)",
    hexString: "#ffa500",
    hslString: "hsl(39, 100%, 50%)",
    hslaArray: [39, 100, 50, 1],
    hslaString: "hsla(39, 100%, 50%, 1)",
  },
  {
    colorName: "Yellow",
    colorObject: new Color(255, 255, 0),
    rgbaArray: [255, 255, 0, 255],
    rgbString: "rgb(255, 255, 0)",
    rgbaString: "rgba(255, 255, 0, 1)",
    hexString: "#ffff00",
    hslString: "hsl(60, 100%, 50%)",
    hslaArray: [60, 100, 50, 1],
    hslaString: "hsla(60, 100%, 50%, 1)",
  },
  {
    colorName: "Green",
    colorObject: new Color(0, 128, 0),
    rgbaArray: [0, 128, 0, 255],
    rgbString: "rgb(0, 128, 0)",
    rgbaString: "rgba(0, 128, 0, 1)",
    hexString: "#008000",
    hslString: "hsl(120, 100%, 25%)",
    hslaArray: [120, 100, 25, 1],
    hslaString: "hsla(120, 100%, 25%, 1)",
  },
  {
    colorName: "Blue",
    colorObject: new Color(0, 0, 255),
    rgbaArray: [0, 0, 255, 255],
    rgbString: "rgb(0, 0, 255)",
    rgbaString: "rgba(0, 0, 255, 1)",
    hexString: "#0000ff",
    hslString: "hsl(240, 100%, 50%)",
    hslaArray: [240, 100, 50, 1],
    hslaString: "hsla(240, 100%, 50%, 1)",
  },
  {
    colorName: "Indigo",
    colorObject: new Color(75, 0, 130),
    rgbaArray: [75, 0, 130, 255],
    rgbString: "rgb(75, 0, 130)",
    rgbaString: "rgba(75, 0, 130, 1)",
    hexString: "#4b0082",
    hslString: "hsl(275, 100%, 25%)",
    hslaArray: [275, 100, 25, 1],
    hslaString: "hsla(275, 100%, 25%, 1)",
  },
  {
    colorName: "Violet",
    colorObject: new Color(238, 130, 238),
    rgbaArray: [238, 130, 238, 255],
    rgbString: "rgb(238, 130, 238)",
    rgbaString: "rgba(238, 130, 238, 1)",
    hexString: "#ee82ee",
    hslString: "hsl(300, 76%, 72%)",
    hslaArray: [300, 76, 72, 1],
    hslaString: "hsla(300, 76%, 72%, 1)",
  },
  {
    colorName: "Brown",
    colorObject: new Color(165, 42, 42),
    rgbaArray: [165, 42, 42, 255],
    rgbString: "rgb(165, 42, 42)",
    rgbaString: "rgba(165, 42, 42, 1)",
    hexString: "#a52a2a",
    hslString: "hsl(0, 59%, 41%)",
    hslaArray: [0, 59, 41, 1],
    hslaString: "hsla(0, 59%, 41%, 1)",
  },
]

const toStringResultType = "rgbaString"

describe("Color", () => {
  it("should be able to create a color from a short hex string", () => {
    const color = new Color("#abc")
    expect(color.rgba).toBe("rgba(170, 187, 204, 1)")
    expect(color.hex).toBe("#aabbcc")
  })

  it.each([0, 4, 25, 32, 50, 64, 100])("should be able to generate colors with alpha at %i%", (alpha) => {
    for (const {
      colorName,q
      rgbaArray: [r, g, b],
      hslaArray: [h, s, l],
    } of testData) {
      const colorFromRgb = new Color(r, g, b, (alpha / 100) * 255)
      expect(colorFromRgb.alphaPercent, `${colorName} from rgba`).toBe(alpha)
      const colorFromHsla = new Color(`hsla(${h}, ${s}%, ${l}%, ${alpha / 100})`)
      expect(colorFromHsla.alphaPercent, `${colorName} from hsla`).toBe(alpha)
    }
  })

  it("should create a color with RGBA values", () => {
    for (const {
      [toStringResultType]: toStringResult,
      rgbaArray: [r, g, b, a],
    } of testData) {
      const color = new Color(r, g, b, a)
      expect(color.toString()).toBe(toStringResult)
      expect(color.r).toBe(r)
      expect(color.g).toBe(g)
      expect(color.b).toBe(b)
      expect(color.a).toBe(a)
    }
  })

  it("should create a color with full opacity when opacity is not specified", () => {
    for (const {
      [toStringResultType]: toStringResult,
      rgbaArray: [r, g, b],
    } of testData) {
      const color = new Color(r, g, b)
      expect(color.toString()).toBe(toStringResult)
      expect(color.a).toBe(255)
    }
  })

  const testSet = [
    { method: "hex", key: "hexString" },
    { method: "rgb", key: "rgbString" },
    { method: "rgba", key: "rgbaString" },
    { method: "hsl", key: "hslString" },
    { method: "hsla", key: "hslaString" },
  ] as const satisfies ReadonlyArray<{ method: keyof Color; key: keyof (typeof testData)[number] }>

  it.each(testSet)("should create a color from $method strings", ({ key, method }) => {
    for (const { colorName, [key]: colorString } of testData) {
      const color = new Color(colorString)
      // note: rounding errors will cause different types of color formats to be different
      // compare the same type of color format to avoid this
      expect(color[method], colorName).toEqual(colorString)
    }
  })

  it.each(testSet)("should be able to create $method string from colors", ({ method, key }) => {
    for (const { colorObject, colorName, [key]: expected } of testData) {
      expect(colorObject[method], colorName).toBe(expected)
    }
  })

  it("should create a color from a Uint8ClampedArray", () => {
    for (const {
      colorName,
      rgbaArray: [r, g, b, a],
    } of testData) {
      const color = new Color(new Uint8ClampedArray([r, g, b, a]))
      expect(color.r, colorName).toBe(r)
      expect(color.g, colorName).toBe(g)
      expect(color.b, colorName).toBe(b)
      expect(color.a, colorName).toBe(a)
    }
  })

  it("should copy a color object", () => {
    for (const { colorObject } of testData) {
      const copiedColor = colorObject.copy()
      expect(copiedColor).toEqual(colorObject)
      expect(copiedColor).not.toBe(colorObject)
    }
  })
})
