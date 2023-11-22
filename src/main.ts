import "./style.css"

import { DrawingApp } from "./app/DrawingApp"

main()

function main() {
  const root = document.getElementById("root")
  if (!root) {
    throw new Error("Root element not found")
  }
  new DrawingApp(root, 500, 500)
}
