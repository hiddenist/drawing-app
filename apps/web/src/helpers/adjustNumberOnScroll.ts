export function adjustNumberOnScroll(e: WheelEvent, currentValue: number) {
  const { deltaY, deltaX } = e
  if (deltaY > 0) return currentValue - 1
  if (deltaY < 0) return currentValue + 1
  if (deltaX < 0) return currentValue - 1
  if (deltaX > 0) return currentValue + 1
  return currentValue
}
