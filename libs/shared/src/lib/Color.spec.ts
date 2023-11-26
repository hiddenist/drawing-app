import { Color } from "./Color"
import { it, describe, expect } from "vitest"

describe("Color", () => {
  it("should create a color with RGB values", () => {
    const color = new Color(255, 0, 0)
    expect(color.rgb).toBe("rgb(255, 0, 0)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(255)
  })

  it("should create a color with full opacity when opacity is not specified", () => {
    const color = new Color(255, 0, 0)
    expect(color.toString()).toBe("rgba(255, 0, 0, 1)")
    expect(color.a).toBe(255)
  })

  it("should create a color with RGBA values", () => {
    const color = new Color(255, 0, 0, 128)
    expect(color.toString()).toBe("rgba(255, 0, 0, 0.5)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(128)
  })

  it("should create a color from a hex value", () => {
    const color = new Color("#FF0000")
    expect(color.toString()).toBe("rgba(255, 0, 0, 1)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(255)
  })

  it("should create a color from an RGB string", () => {
    const color = new Color("rgb(255, 0, 0)")
    expect(color.toString()).toBe("rgba(255, 0, 0, 1)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(255)
  })

  it("should create a color from an RGBA string", () => {
    const rgbaString = "rgba(255, 0, 0, 0.5)"
    const color = new Color(rgbaString)
    expect(color.toString()).toBe(rgbaString)
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(128)
  })

  it("should create a color from an HSL string", () => {
    const color = new Color("hsl(0, 100%, 50%)")
    expect(color.toString()).toBe("rgba(255, 0, 0, 1)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(255)
  })

  it("should create a color from an HSLA string", () => {
    const color = new Color("hsla(0, 100%, 50%, 0.5)")
    expect(color.toString()).toBe("rgba(255, 0, 0, 0.5)")
    expect(color.r).toBe(255)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
    expect(color.a).toBe(128)
  })

  it("should copy a color object", () => {
    const originalColor = new Color(255, 0, 0)
    const copiedColor = originalColor.copy()
    expect(copiedColor).toEqual(originalColor)
    expect(copiedColor).not.toBe(originalColor)
  })
})
