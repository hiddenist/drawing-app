export function getImageOffset(canvas: HTMLCanvasElement, imageWidth: number, imageHeight: number) {
  const { width, height } = canvas
  const canvasAspectRatio = width / height

  const aspectRatio = imageWidth / imageHeight

  let offsetX = 0
  let offsetY = 0

  if (aspectRatio < canvasAspectRatio || imageHeight != height) {
    offsetY = (height - imageHeight) / 2
  }

  if (aspectRatio > canvasAspectRatio || imageWidth != width) {
    offsetX = (width - imageWidth) / 2
  }

  return [offsetX, offsetY]
}
