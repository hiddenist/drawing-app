// Event handler utilities for JSX factory

export interface EventOptions {
  passive?: boolean
  capture?: boolean
}

export interface ParsedEventAttribute {
  type: "event"
  eventName: string
  handler: EventListener
  options?: EventOptions
}

export class EventAttributeParser {
  private eventOptions: { [eventName: string]: EventOptions } = {}

  /**
   * Parse all event-related attributes and return separated handlers and options
   */
  parseEventAttributes(attrs: { [key: string]: any }): {
    eventHandlers: ParsedEventAttribute[]
    nonEventAttrs: { [key: string]: any }
  } {
    // First pass: collect event options
    this.collectEventOptions(attrs)

    // Second pass: categorize all attributes
    const categorizedAttrs = Object.entries(attrs)
      .map(([name, value]) => this.categorizeAttribute(name, value))
      .filter((attr) => attr != null)

    const eventHandlers = categorizedAttrs.filter((attr): attr is ParsedEventAttribute => attr.type === "event")

    const nonEventAttrs = categorizedAttrs
      .filter((attr) => attr.type === "regular")
      .reduce(
        (acc, attr) => {
          acc[attr.name] = attr.value
          return acc
        },
        {} as { [key: string]: any },
      )

    return { eventHandlers, nonEventAttrs }
  }

  private categorizeAttribute(
    name: string,
    value: any,
  ): ParsedEventAttribute | { type: "regular"; name: string; value: any } | null {
    // Skip event option attributes (already processed)
    if (this.isEventOptionAttribute(name)) {
      return null
    }

    // Handle event handlers
    if (this.isEventHandler(name, value)) {
      const eventName = name.toLowerCase().slice(2)
      return {
        type: "event" as const,
        eventName,
        handler: value,
        options: this.getEventOptions(eventName),
      }
    }

    // Regular attributes
    return {
      type: "regular" as const,
      name,
      value,
    }
  }

  private collectEventOptions(attrs: { [key: string]: any }): void {
    const eventOptionsFromAttributes = Object.entries(attrs)
      .map(([name, value]) => this.parseEventOption(name, value))
      .filter((option) => option != null)

    for (const { eventName, optionType, value } of eventOptionsFromAttributes) {
      this.setEventOption(eventName, optionType, value)
    }
  }

  private parseEventOption(
    name: string,
    value: any,
  ): { eventName: string; optionType: "passive" | "capture"; value: any } | null {
    const match = name.toLowerCase().match(/^on([a-z]+)(passive|capture)$/)

    if (!match) return null

    return {
      eventName: match[1],
      optionType: match[2] as "passive" | "capture",
      value,
    }
  }

  private setEventOption(eventName: string, optionType: "passive" | "capture", value: any): void {
    if (!this.eventOptions[eventName]) {
      this.eventOptions[eventName] = {}
    }
    this.eventOptions[eventName][optionType] = value
  }

  private isEventOptionAttribute(name: string): boolean {
    return !!name.toLowerCase().match(/^on[a-z]+(passive|capture)$/)
  }

  private isEventHandler(name: string, val: any): boolean {
    return name.startsWith("on") && typeof val === "function"
  }

  private getEventOptions(eventName: string): EventOptions | undefined {
    // Check for explicit options first
    const explicitOptions = this.eventOptions[eventName]
    if (explicitOptions) {
      return explicitOptions
    }

    // Fall back to auto-detection for scroll-blocking events
    return this.getDefaultEventOptions(eventName)
  }

  private getDefaultEventOptions(eventName: string): EventOptions | undefined {
    const scrollBlockingEvents = ["wheel", "touchstart", "touchmove", "touchend"]
    const isScrollBlocking = scrollBlockingEvents.includes(eventName)

    return isScrollBlocking ? { passive: false } : undefined
  }
}

export function attachEventListeners(element: HTMLElement, eventHandlers: ParsedEventAttribute[]): void {
  for (const { eventName, handler, options } of eventHandlers) {
    element.addEventListener(eventName, handler, options)
  }
}
