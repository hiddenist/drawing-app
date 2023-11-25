import { CreateLibOptions } from "../../types/CreateLibOptions"

export default function generate(options: CreateLibOptions) {
  return `export * from "./lib/${options.libFolderName}"\n`
}
