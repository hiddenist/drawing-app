import { CreateLibOptions } from "../../types/CreateLibOptions"

export default function generate(_options: CreateLibOptions) {
  return 'export * from "./lib/hello"'
}
