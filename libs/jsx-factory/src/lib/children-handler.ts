// Children handling utilities for JSX factory

export class ChildrenHandler {
  /**
   * Append children to an element, handling arrays and text nodes
   */
  appendChildren(element: HTMLElement, children: (HTMLElement | string)[]): void {
    const stack: any[] = [...children]

    while (stack.length) {
      const child = stack.shift()

      if (child == null) continue

      // Is child a leaf?
      if (!Array.isArray(child)) {
        this.appendChild(element, child)
      } else {
        // Flatten arrays
        stack.push(...child)
      }
    }
  }

  private appendChild(element: HTMLElement, child: HTMLElement | string): void {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child))
    } else if (child.nodeType != null) {
      // It's already a DOM node
      element.appendChild(child)
    } else {
      // Convert to string and create text node
      element.appendChild(document.createTextNode(child.toString()))
    }
  }
}
