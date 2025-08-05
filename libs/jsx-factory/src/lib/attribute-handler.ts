// Attribute handling utilities for JSX factory

import { escapeHtml } from "./escape-html"

export interface SpecialAttribute {
  name: string
  value: any
  type: "ref" | "style" | "boolean" | "regular"
}

export class AttributeHandler {
  /**
   * Apply non-event attributes to an element
   */
  applyAttributes(element: HTMLElement, attrs: { [key: string]: any }): void {
    for (const [name, val] of Object.entries(attrs)) {
      const mappedName = escapeHtml(this.mapAttributeName(name))
      const special = this.categorizeAttribute(mappedName, val)

      this.applyAttribute(element, special)
    }
  }

  /**
   * Map JSX attribute names to HTML attribute names for React compatibility
   */
  private mapAttributeName(name: string): string {
    const mappings = {
      tabIndex: "tabindex",
      className: "class",
      readOnly: "readonly",
    } as const

    return mappings[name as keyof typeof mappings] || name
  }

  private categorizeAttribute(name: string, value: any): SpecialAttribute {
    if (name === "ref") {
      return { name, value, type: "ref" }
    }

    if (name === "style") {
      return { name, value, type: "style" }
    }

    if (value === true) {
      return { name, value, type: "boolean" }
    }

    return { name, value, type: "regular" }
  }

  private applyAttribute(element: HTMLElement, attr: SpecialAttribute): void {
    switch (attr.type) {
      case "ref":
        this.applyRef(element, attr.value)
        break

      case "style":
        this.applyStyle(element, attr.value)
        break

      case "boolean":
        this.applyBooleanAttribute(element, attr.name)
        break

      case "regular":
        this.applyRegularAttribute(element, attr.name, attr.value)
        break
    }
  }

  private applyRef(element: HTMLElement, refCallback: (el: HTMLElement) => void): void {
    refCallback(element)
  }

  private applyStyle(element: HTMLElement, styles: { [key: string]: any }): void {
    Object.assign(element.style, styles)
  }

  private applyBooleanAttribute(element: HTMLElement, name: string): void {
    element.setAttribute(name, name)
  }

  private applyRegularAttribute(element: HTMLElement, name: string, value: any): void {
    if (value === false) {
      element.removeAttribute(name)
    } else if (value != null) {
      element.setAttribute(name, escapeHtml(value))
    }
  }
}
