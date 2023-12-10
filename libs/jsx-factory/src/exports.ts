// --- jsxFactory.ts ---
/* https://gist.github.com/borestad/eac42120613bc67a3714f115e8b485a7
 * Custom jsx parser
 * See: tsconfig.json
 *
 *   {
 *     "jsx": "react",
 *     "jsxFactory": "h",
 *     "lib": [
 *       "es2017",
 *       "dom",
 *       "dom.iterable"
 *     ]
 *   }
 *s
 */

export { createDomElement } from "./lib/create-dom-element"
export { createDomFragment } from "./lib/create-dom-fragment"

export type { FunctionComponent } from "../types/function-component"
