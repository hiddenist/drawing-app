import { defineConfig } from "vite"

import plainText from "vite-plugin-plain-text"

const baseUrl = process.env.BASE_URL ?? "/"

export default defineConfig({
  base: baseUrl.startsWith("/") ? baseUrl : `/${baseUrl}`,
  plugins: [plainText(["**/*.glsl"], { namedExport: false })],
})
