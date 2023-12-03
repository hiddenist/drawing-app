import { Color } from "./Color"
import { it, describe, expect } from "vitest"

const testData: ReadonlyArray<{
  colorName: string
  colorObject: Color
  rgbArray: [number, number, number]
  hslArray: [number, number, number]
  rgbString: string
  rgbaString: string
  hexString: string
  hslString: string
  hslaString: string
}> = [
  {
    colorName: "Black",
    colorObject: Color.BLACK,
    rgbArray: [0, 0, 0],
    rgbString: "rgb(0, 0, 0)",
    rgbaString: "rgba(0, 0, 0, 1)",
    hexString: "#000000",
    hslString: "hsl(0, 0%, 0%)",
    hslArray: [0, 0, 0],
    hslaString: "hsla(0, 0%, 0%, 1)",
  },
  {
    colorName: "White",
    colorObject: Color.WHITE,
    rgbArray: [255, 255, 255],
    rgbString: "rgb(255, 255, 255)",
    rgbaString: "rgba(255, 255, 255, 1)",
    hexString: "#ffffff",
    hslString: "hsl(0, 0%, 100%)",
    hslArray: [0, 0, 100],
    hslaString: "hsla(0, 0%, 100%, 1)",
  },
  {
    colorName: "Red",
    colorObject: new Color(255, 0, 0),
    rgbArray: [255, 0, 0],
    rgbString: "rgb(255, 0, 0)",
    rgbaString: "rgba(255, 0, 0, 1)",
    hexString: "#ff0000",
    hslString: "hsl(0, 100%, 50%)",
    hslArray: [0, 100, 50],
    hslaString: "hsla(0, 100%, 50%, 1)",
  },
  {
    colorName: "Orange",
    colorObject: new Color(255, 165, 0),
    rgbArray: [255, 165, 0],
    rgbString: "rgb(255, 165, 0)",
    rgbaString: "rgba(255, 165, 0, 1)",
    hexString: "#ffa500",
    hslString: "hsl(39, 100%, 50%)",
    hslArray: [39, 100, 50],
    hslaString: "hsla(39, 100%, 50%, 1)",
  },
  {
    colorName: "Yellow",
    colorObject: new Color(255, 255, 0),
    rgbArray: [255, 255, 0],
    rgbString: "rgb(255, 255, 0)",
    rgbaString: "rgba(255, 255, 0, 1)",
    hexString: "#ffff00",
    hslString: "hsl(60, 100%, 50%)",
    hslArray: [60, 100, 50],
    hslaString: "hsla(60, 100%, 50%, 1)",
  },
  {
    colorName: "Green",
    colorObject: new Color(0, 128, 0),
    rgbArray: [0, 128, 0],
    rgbString: "rgb(0, 128, 0)",
    rgbaString: "rgba(0, 128, 0, 1)",
    hexString: "#008000",
    hslString: "hsl(120, 100%, 25%)",
    hslArray: [120, 100, 25],
    hslaString: "hsla(120, 100%, 25%, 1)",
  },
  {
    colorName: "Blue",
    colorObject: new Color(0, 0, 255),
    rgbArray: [0, 0, 255],
    rgbString: "rgb(0, 0, 255)",
    rgbaString: "rgba(0, 0, 255, 1)",
    hexString: "#0000ff",
    hslString: "hsl(240, 100%, 50%)",
    hslArray: [240, 100, 50],
    hslaString: "hsla(240, 100%, 50%, 1)",
  },
  {
    colorName: "Indigo",
    colorObject: new Color(75, 0, 130),
    rgbArray: [75, 0, 130],
    rgbString: "rgb(75, 0, 130)",
    rgbaString: "rgba(75, 0, 130, 1)",
    hexString: "#4b0082",
    hslString: "hsl(275, 100%, 25%)",
    hslArray: [275, 100, 25],
    hslaString: "hsla(275, 100%, 25%, 1)",
  },
  {
    colorName: "Violet",
    colorObject: new Color(238, 130, 238),
    rgbArray: [238, 130, 238],
    rgbString: "rgb(238, 130, 238)",
    rgbaString: "rgba(238, 130, 238, 1)",
    hexString: "#ee82ee",
    hslString: "hsl(300, 76%, 72%)",
    hslArray: [300, 76, 72],
    hslaString: "hsla(300, 76%, 72%, 1)",
  },
  {
    colorName: "Brown",
    colorObject: new Color(165, 42, 42),
    rgbArray: [165, 42, 42],
    rgbString: "rgb(165, 42, 42)",
    rgbaString: "rgba(165, 42, 42, 1)",
    hexString: "#a52a2a",
    hslString: "hsl(0, 59%, 41%)",
    hslArray: [0, 59, 41],
    hslaString: "hsla(0, 59%, 41%, 1)",
  },
  {
    colorName: "Gray",
    colorObject: new Color(128, 128, 128),
    rgbArray: [128, 128, 128],
    rgbString: "rgb(128, 128, 128)",
    rgbaString: "rgba(128, 128, 128, 1)",
    hexString: "#808080",
    hslString: "hsl(0, 0%, 50%)",
    hslArray: [0, 0, 50],
    hslaString: "hsla(0, 0%, 50%, 1)",
  },
]

const toStringResultType = "rgbString"

describe("Color", () => {
  it("should create a color with RGB values", () => {
    for (const {
      [toStringResultType]: toStringResult,
      rgbArray: [r, g, b],
    } of testData) {
      const color = new Color(r, g, b)
      expect(color.toString()).toBe(toStringResult)
      expect(color.r).toBe(r)
      expect(color.g).toBe(g)
      expect(color.b).toBe(b)
    }
  })

  it("should return an rgb string with toString", () => {
    for (const { colorObject, rgbString, colorName } of testData) {
      expect(colorObject.toString(), colorName).toBe(rgbString)
    }
    expect(toStringResultType).toBe("rgbString")
  })

  it("should return a Uint8ClampedArray of length 3 with the vec3 parameter", () => {
    expect(Color.WHITE.vec3).toBeInstanceOf(Uint8ClampedArray)
    expect(Color.WHITE.vec3).toHaveLength(3)
  })

  it("should return the red channel value with r", () => {
    for (const {
      colorObject,
      rgbArray: [r],
      colorName,
    } of testData) {
      expect(colorObject.r, colorName).toBe(r)
    }
  })

  it("should return the green channel value with g", () => {
    for (const {
      colorObject,
      rgbArray: [_, g],
      colorName,
    } of testData) {
      expect(colorObject.g, colorName).toBe(g)
    }
  })

  it("should return the blue channel value with b", () => {
    for (const {
      colorObject,
      rgbArray: [_, __, b],
      colorName,
    } of testData) {
      expect(colorObject.b, colorName).toBe(b)
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

  it("should be able to create a color from a short hex string", () => {
    const color = new Color("#abc")
    expect(color.rgba).toBe("rgba(170, 187, 204, 1)")
    expect(color.hex).toBe("#aabbcc")
  })

  it.each(testSet)("should be able to create $method string from colors", ({ method, key }) => {
    for (const { colorObject, colorName, [key]: expected } of testData) {
      expect(colorObject[method], colorName).toBe(expected)
    }
  })

  it("should create a color from a Uint8ClampedArray", () => {
    for (const {
      colorName,
      rgbArray: [r, g, b],
    } of testData) {
      const color = new Color(new Uint8ClampedArray([r, g, b]))
      expect(color.r, colorName).toBe(r)
      expect(color.g, colorName).toBe(g)
      expect(color.b, colorName).toBe(b)
    }
  })

  it("should copy a color object", () => {
    for (const { colorObject } of testData) {
      const copiedColor = colorObject.copy()
      expect(copiedColor).toEqual(colorObject)
      expect(copiedColor).not.toBe(colorObject)
    }
  })

  it("should have the right colors for constant values", () => {
    expect(Color.BLACK.hex).toBe("#000000")
    expect(Color.WHITE.hex).toBe("#ffffff")
  })
})
