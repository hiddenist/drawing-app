interface entityMapData {
  [key: string]: string
}
const entityMap: entityMapData = {
  "&": "amp",
  "<": "lt",
  ">": "gt",
  '"': "quot",
  "'": "#39",
  "/": "#x2F",
}

export const escapeHtml = (str: object[] | string) => String(str).replace(/[&<>"'\/\\]/g, (s) => `&${entityMap[s]};`)
