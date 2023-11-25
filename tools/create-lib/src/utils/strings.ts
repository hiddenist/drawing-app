export function toKebabCase(string: string): string {
  return string
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
}

export function toLowerCamelCase(string: string): string {
  return string
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => (index === 0 ? letter.toLowerCase() : letter.toUpperCase()))
    .replace(/[^a-zA-Z0-9_]/g, "")
}
