import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import { CreateLibOptions } from "../types/CreateLibOptions"
import path from "node:path"

export default function generate(options: Required<CreateLibOptions>) {
  const packageJson: PackageJson = {
    name: options.packageName,
    version: options.version,
    description: options.description,
    private: options.isPrivate,
    main: `${path.join(".", "src", options.mainFileName)}`,
  }

  return JSON.stringify(packageJson, null, 2)
}
