// walk all of the files in the template folder and dynamically import them

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { GenerateFunction } from "./types/GenerateFunction"
import type { CreateLibOptions } from "./types/CreateLibOptions"
import { argv } from "node:process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
class ArgumentError extends Error {}

await main()

interface FileContent {
  fileName: string
  content: string
  subFolder?: string
}

async function main() {
  try {
    const options = getOptionsFromArgs()
    const templates = await getTemplatesFromFolder(options)

    createLibFromTemplateContent(templates, options)
  } catch (error) {
    if (error instanceof ArgumentError) {
      console.error("ERROR: " + error.message + "\n")
      process.exit(1)
    }
    throw error
  }
}

function getOptionsWithDefaults(libName: string) {
  return {
    libName,
    packageName: `@libs/${toKebabCase(libName)}`,
    mainFileName: "src/exports.ts",
    templateFolder: "template",
    isPrivate: true,
    version: "0.0.0",
    libFolderName: toKebabCase(libName),
    libFunctionName: toLowerCamelCase(libName),
  } satisfies CreateLibOptions
}

function getOptionsFromArgs(): Required<CreateLibOptions> {
  const args = argv.slice(2)
  if (args.length === 0) {
    throw new ArgumentError("No arguments provided. Expected: <libName> [description] [version] [public|private]")
  }
  const libName = args[0]
  const description = args[1]
  const version = args[2]
  const isPrivate = args[3] !== "public"

  if (version && !/[^\d+.\d+.\d+$]/.test(version)) {
    throw new ArgumentError("Version (argument 3) must be in the format of x.x.x")
  }

  return {
    ...getOptionsWithDefaults(libName),
    description,
    version,
    isPrivate,
  }
}

type Formatter = (options: CreateLibOptions, filePath: URL) => Promise<string>
async function getTemplatesFromFolder(
  options: CreateLibOptions,
  folderName?: string,
  depth = 0,
): Promise<
  (FileContent & {
    depth: number
  })[]
> {
  const formatters: [string | RegExp, Formatter][] = [
    [/\.template\..+$/, generateContentFromTextFile],
    [".ts", generateContentFromTsFile],
  ]

  const templateDir = path.join(__dirname, options.templateFolder ?? "template", folderName ?? "")
  const files = fs.readdirSync(templateDir)
  const templateStructure = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(templateDir, fileName)
      const modulePath = new URL(`file://${filePath}`)
      const fileLocation = folderName ? path.join(folderName, fileName) : fileName
      if (await isFileDirectory(filePath)) {
        return await getTemplatesFromFolder(options, fileLocation, depth + 1)
      }
      return {
        ...(await generateTemplateFromFile(options, formatters, modulePath, fileLocation)),
        subFolder: folderName,
        depth,
      }
    }),
  )
  const templates = templateStructure.flat()
  templates.sort((a, b) => {
    if (a.depth !== b.depth) {
      return a.depth - b.depth
    }
    return a.fileName.localeCompare(b.fileName)
  })
  return templates
}

async function isFileDirectory(filePath: string): Promise<boolean> {
  const stat = await fs.promises.stat(filePath)
  return stat.isDirectory()
}

async function generateTemplateFromFile(
  options: CreateLibOptions,
  formatters: [string | RegExp, Formatter][],
  modulePath: URL,
  fileName: string,
): Promise<FileContent> {
  const matchesExtension = (extension: string | RegExp) => {
    if (extension instanceof RegExp) {
      const match = fileName.match(extension)
      if (match) {
        return match[0]
      }
    } else if (fileName.endsWith(extension)) {
      return extension
    }
    return null
  }
  for (const [extension, formatter] of formatters) {
    const extensionMatch = matchesExtension(extension)
    if (extensionMatch) {
      return {
        fileName: formatFileName(fileName, options, extensionMatch),
        content: await formatter(options, modulePath),
      }
    }
  }
  throw new Error(`No formatter found for ${fileName}`)
}

function formatFileName(fileName: string, options: CreateLibOptions, extension: string): string {
  const fileNameWithoutExtension = fileName.endsWith(extension)
    ? fileName.slice(0, fileName.length - extension.length)
    : fileName
  return replaceTemplateStrings(fileNameWithoutExtension, options)
}

async function generateContentFromTextFile(options: CreateLibOptions, filePath: URL): Promise<string> {
  const template = fs.readFileSync(filePath, "utf-8")
  return replaceTemplateStrings(template, options)
}

async function generateContentFromTsFile(options: CreateLibOptions, filePath: URL): Promise<string> {
  const module = (await import(filePath.toString())) as { default: GenerateFunction }
  return module.default(options)
}

function replaceTemplateStrings<K extends string>(template: string, options: Partial<Record<K, unknown>>): string {
  return template.replace(/__(.+?)__/g, (match, key: K) => {
    const replacement = options[key]
    if (typeof replacement === "string") {
      return replacement
    }
    return match
  })
}

function createLibFromTemplateContent(content: FileContent[], options: Required<CreateLibOptions>): void {
  for (const { fileName, content: fileContent } of content) {
    const filePath = path.join(getWorkspaceRoot(), "libs", options.libFolderName, fileName)
    const folder = path.dirname(filePath)
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(filePath, fileContent)
  }
}

function getWorkspaceRoot() {
  return path.join(__dirname, "..", "..", "..")
}

function toKebabCase(string: string): string {
  return string
    .replace(/[\s_]+/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
}

function toLowerCamelCase(string: string): string {
  return string
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => (index === 0 ? letter.toLowerCase() : letter.toUpperCase()))
    .replace(/[^a-zA-Z0-9_]/g, "")
}
