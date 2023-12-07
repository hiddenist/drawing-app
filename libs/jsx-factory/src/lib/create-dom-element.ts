import { AttributeMapper } from "./attribute-mapper"
import { escapeHtml } from "./escape-html"
import { FunctionComponent } from "../types/function-component"

export function createDomElement(
  tag: FunctionComponent | string,
  attrs?: { [key: string]: any },
  ...children: (HTMLElement | string)[]
): HTMLElement {
  attrs = attrs || {}
  const stack: any[] = [...children]

  // Support for components(ish)
  if (typeof tag === "function") {
    attrs.children = stack
    return tag(attrs)
  }

  const elm = document.createElement(tag)

  // Add attributes
  for (let [name, val] of Object.entries(attrs)) {
    name = escapeHtml(AttributeMapper(name))
    if (name.startsWith("on") && name.toLowerCase() in window) {
      elm.addEventListener(name.toLowerCase().slice(2), val)
    } else if (name === "ref") {
      val(elm)
    } else if (name === "style") {
      Object.assign(elm.style, val)
    } else if (val === true) {
      elm.setAttribute(name, name)
    } else if (val !== false && val != null) {
      elm.setAttribute(name, escapeHtml(val))
    } else if (val === false) {
      elm.removeAttribute(name)
    }
  }

  // Append children
  while (stack.length) {
    const child = stack.shift()

    if (child == null) continue

    // Is child a leaf?
    if (!Array.isArray(child)) {
      elm.appendChild((child as HTMLElement).nodeType == null ? document.createTextNode(child.toString()) : child)
    } else {
      stack.push(...child)
    }
  }

  return elm
}
