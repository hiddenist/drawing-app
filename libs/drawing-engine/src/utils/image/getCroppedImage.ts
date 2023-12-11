import type { SourceImage } from "./SourceImage"
import { getImageDimensions } from "./getImageDimensions"
import { getImageOffset } from "./getImageOffset"

export function getCroppedImage(source: SourceImage, width: number, height: number) {
  const dims = getImageDimensions(source)
  if (!dims) {
    return source
  }
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const [offsetX, offsetY] = getImageOffset(canvas, source)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return source
  }
  ctx.drawImage(source, offsetX, offsetY, dims.width, dims.height)
  return canvas
}
