import { CreateLibOptions } from "../types/CreateLibOptions"
import { toKebabCase, toLowerCamelCase } from "./strings"

export class ArgumentError extends Error {}

const USAGE = `Usage: create-lib <libName> [description] [--version=<version>] [--public] [--dry-run]`
// thanks copilot, this would have been a pain to write
const HELP_DOCS = `
${USAGE}

  libName:   
      The name of the library to create. This will be used to create the
      package name, folder name, and function name. Required.

  description:
      The description of the library. This will be used in the
      package.json file. Optional.
    
  --version=<version>
      The version of the library. This will be used in the package.json
      file. Must be in the format of x.x.x

  --public
      If provided, the library will be public. Otherwise, it will be
      private.

  --dry-run
      If provided, the library will not be created. Instead, the output
      will be logged to the console.

  --help
      If provided as the only argument, this message will be displayed.
`

export function processArguments(argv: ReadonlyArray<string>): Required<CreateLibOptions> {
  const args = argv.slice(2)
  if (args[0] === "--help") {
    console.log(HELP_DOCS)
    process.exit(0)
  }
  if (args.length === 0) {
    throw new ArgumentError(`No arguments provided. Run with --help for more information.\n\n${USAGE}`)
  }
  const version = getArgsValue(args, "--version")
  const isPrivate = getArgsFlag(args, "--public")
  const isDryRun = getArgsFlag(args, "--dry-run")
  const libName = args[0]
  const description = args[1] ?? ""
  if (args.length > 2 || libName.startsWith("--") || description.startsWith("--")) {
    throw new ArgumentError(`Unexpected arguments provided. Run with --help for more information.\n\n${USAGE}`)
  }

  if (version && !/[^\d+.\d+.\d+$]/.test(version)) {
    throw new ArgumentError("Version (argument 3) must be in the format of x.x.x")
  }

  return {
    libName,
    description,
    packageName: `@libs/${toKebabCase(libName)}`,
    mainFileName: "src/exports.ts",
    templateFolder: "template",
    isPrivate: isPrivate ?? true,
    version: version || "0.0.0",
    libFolderName: toKebabCase(libName),
    libFunctionName: toLowerCamelCase(libName),
    isDryRun: isDryRun,
  }
}

export function getArgsFlag(args: string[], flag: string): boolean {
  const index = args.indexOf(flag)
  if (index === -1) {
    return false
  }
  args.splice(index, 1)
  return true
}

export function getArgsValue(args: string[], flag: string): string | undefined {
  const index = args.findIndex((arg) => arg.startsWith(flag))
  if (index === -1) {
    return undefined
  }
  const arg = args[index].split("=")
  if (arg.length === 2) {
    args.splice(index, 1)
    return arg[1]
  }
  const value = args[index + 1]
  if (!value) {
    throw new ArgumentError(`No value provided for ${flag}`)
  }
  args.splice(index, 2)
  return value
}
