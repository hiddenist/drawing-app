import "./style.css"

import { WebDrawingApp } from "@libs/webgl"

main()

function main() {
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element not found")
  }
  new WebDrawingApp(root, 500, 500)
}
