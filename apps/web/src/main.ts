import "./style.css"

import { WebDrawingApp } from "@libs/webgl"

main()

function main() {
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element not found")
  }
  const width = Math.min(window.innerWidth, 500)
  const height = Math.min(window.innerHeight, 500)
  new WebDrawingApp(root, width, height)
}
