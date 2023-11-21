import { defineConfig } from 'vite'

import plainText from 'vite-plugin-plain-text'

export default defineConfig({
  plugins: [
    plainText(
      ['**/*.glsl'],
      { namedExport: false },
    ),
  ]
})
