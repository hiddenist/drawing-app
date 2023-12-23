import type { SourceImage } from "./SourceImage"
import { getImageDimensions } from "./getImageDimensions"
import { getImageOffset } from "./getImageOffset"

export function getCroppedImage(source: SourceImage, width: number, height: number, shouldScaleDown = false) {
  const dims = getImageDimensions(source)
  if (!dims) {
    return source
  }
  let imageWidth = dims.width
  let imageHeight = dims.height
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return source
  }

  const canvasAspectRatio = width / height
  const aspectRatio = imageWidth / imageHeight
  if (shouldScaleDown) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    if (imageWidth > width && aspectRatio >= canvasAspectRatio) {
      imageWidth = width
      imageHeight = imageWidth / aspectRatio
    }
    if (imageHeight > height && aspectRatio < canvasAspectRatio) {
      imageHeight = height
      imageWidth = imageHeight * aspectRatio
    }
  }
  const [offsetX, offsetY] = getImageOffset(canvas, imageWidth, imageHeight)
  ctx.drawImage(source, offsetX, offsetY, imageWidth, imageHeight)
  return canvas
}
