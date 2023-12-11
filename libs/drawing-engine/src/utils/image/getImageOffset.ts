import type { SourceImage } from "./SourceImage"
import { getImageDimensions } from "./getImageDimensions"

export function getImageOffset(canvas: HTMLCanvasElement, source: SourceImage) {
  const { width, height } = canvas
  const canvasAspectRatio = width / height

  const sourceDim = getImageDimensions(source) ?? { width, height }
  const aspectRatio = sourceDim.width / sourceDim.height

  let offsetX = 0
  let offsetY = 0

  if (aspectRatio < canvasAspectRatio || sourceDim.height != height) {
    offsetY = (height - sourceDim.height) / 2
  }

  if (aspectRatio > canvasAspectRatio || sourceDim.width != width) {
    offsetX = (width - sourceDim.width) / 2
  }

  return [offsetX, offsetY]
}
