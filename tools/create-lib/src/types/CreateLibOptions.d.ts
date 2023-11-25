export interface CreateLibOptions {
  libName: string
  /**
   * @default "@libs/{libName}"
   */
  packageName?: string
  description?: string
  /**
   * @default "0.0.0"
   */
  version?: string
  /**
   * @default "true"
   */
  isPrivate?: boolean
  /**
   * @default "src/exports.ts"
   */
  mainFileName?: string
  /**
   * @default "template"
   */
  templateFolder?: string
  /**
   * By default, this will format the libName to kebab-case.
   * No subfolders may be created within the lib folder.
   */
  libFolderName?: string
  /**
   * By default, this will format the libName to lowerCamelCase.
   */
  libFunctionName?: string
  isDryRun?: boolean
}
