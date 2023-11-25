import { Vec2 } from "../exports"

export function getEventPosition(
  event: Event,
  /**
   * If not provided, the position will be relative to the event target.
   */
  relativeToElement?: HTMLElement,
): Vec2 {
  if (!(event instanceof MouseEvent)) {
    return [NaN, NaN]
  }

  const target = relativeToElement ?? event.target
  if (!(target instanceof HTMLElement)) {
    return [NaN, NaN]
  }

  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  return [x, y]
}
