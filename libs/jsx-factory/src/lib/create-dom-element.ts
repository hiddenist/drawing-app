import { FunctionComponent } from "../../types/function-component"
import { EventAttributeParser, attachEventListeners } from "./event-handler"
import { AttributeHandler } from "./attribute-handler"
import { ChildrenHandler } from "./children-handler"

export function createDomElement(
  tag: FunctionComponent | string,
  attrs?: { [key: string]: any },
  ...children: (HTMLElement | string)[]
): HTMLElement {
  attrs = attrs || {}

  // Support for components(ish)
  if (typeof tag === "function") {
    attrs.children = children
    return tag(attrs)
  }

  const element = document.createElement(tag)

  // Parse and separate event handlers from other attributes
  const eventParser = new EventAttributeParser()
  const { eventHandlers, nonEventAttrs } = eventParser.parseEventAttributes(attrs)

  // Apply event listeners
  attachEventListeners(element, eventHandlers)

  // Apply other attributes
  const attributeHandler = new AttributeHandler()
  attributeHandler.applyAttributes(element, nonEventAttrs)

  // Append children
  const childrenHandler = new ChildrenHandler()
  childrenHandler.appendChildren(element, children)

  return element
}
