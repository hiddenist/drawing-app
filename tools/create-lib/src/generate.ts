// walk all of the files in the template folder and dynamically import them

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { GenerateFunction } from "./types/GenerateFunction"
import type { CreateLibOptions } from "./types/CreateLibOptions"
import { argv } from "node:process"
import { processArguments, ArgumentError } from "./utils/args"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

await main()

interface FileContent {
  fileName: string
  content: string
}

async function main() {
  try {
    const options = processArguments(argv)
    const templates = await getTemplatesFromFolder(options)

    // console.log(templates)

    createLibFromTemplateContent(templates, options)
  } catch (error) {
    if (error instanceof ArgumentError) {
      console.error("ERROR: " + error.message + "\n")
      process.exit(1)
    }
    throw error
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
  console.log(folderName, files)
  const templateStructure = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(templateDir, fileName)
      const modulePath = new URL(`file://${filePath}`)
      const fileLocation = folderName ? path.join(folderName, fileName) : fileName
      if (await isFileDirectory(filePath)) {
        return await getTemplatesFromFolder(options, fileLocation, depth + 1)
      }
      const templatedFile = await generateTemplateFromFile(options, formatters, modulePath, fileLocation)

      if (fileName === "__mainFileName__.ts") {
        console.log(fileName, { filePath, fileLocation, templatedFile })
      }
      return {
        ...templatedFile,
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
  console.log(templates)
  return templates
}

async function isFileDirectory(filePath: string): Promise<boolean> {
  const stat = await fs.promises.stat(filePath)
  return stat.isDirectory()
}

function matchesExtension(fileName: string, extension: string | RegExp): string | null {
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

async function generateTemplateFromFile(
  options: CreateLibOptions,
  formatters: [string | RegExp, Formatter][],
  modulePath: URL,
  fileName: string,
): Promise<FileContent> {
  for (const [extension, formatter] of formatters) {
    const extensionMatch = matchesExtension(fileName, extension)
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
    if (options.isDryRun) {
      console.log(`Dry run: Create folder ${folder}`)
      console.log(`Dry run: Create file ${filePath}`)
      continue
    }
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(filePath, fileContent)
  }
}

function getWorkspaceRoot() {
  return path.join(__dirname, "..", "..", "..")
}
