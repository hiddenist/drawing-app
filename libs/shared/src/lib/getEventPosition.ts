export function getEventPosition(
  event: Event,
  /**
   * If not provided, the position will be relative to the event target.
   */
  relativeToElement?: HTMLElement,
): [x: number, y: number] {
  if (!(event instanceof MouseEvent)) {
    throw new Error("Event must be a MouseEvent")
  }

  const target = relativeToElement ?? event.target
  if (!(target instanceof HTMLElement)) {
    throw new Error("Target element must be an HTMLElement")
  }

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return [x, y]
}
