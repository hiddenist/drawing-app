export function getImageDimensions(image: TexImageSource) {
  let width = 0
  let height = 0

  if (image instanceof HTMLVideoElement) {
    width = image.videoWidth
    height = image.videoHeight
  } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
    width = image.width
    height = image.height
  }

  if (!width || !height) {
    return null
  }

  return {
    width,
    height,
  }
}
