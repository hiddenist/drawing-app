// To keep some consistency with React DOM, lets use a mapper
// https://reactjs.org/docs/dom-elements.html
export const AttributeMapper = (val: string) =>
  ({
    tabIndex: "tabindex",
    className: "class",
    readOnly: "readonly",
  })[val] || val
