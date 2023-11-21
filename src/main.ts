const vertexShaderSource = require("./shaders/vertex.glsl");

function main() {
  const root = document.getElementById("#root")
  if (!root) {
    throw new Error("Root element not found")
  }
  const canvas = document.createElement("canvas")
  root.appendChild(canvas)

  const gl = canvas.getContext("webgl")

  if (!gl) {
    throw new Error("WebGL not supported")
  }
}
