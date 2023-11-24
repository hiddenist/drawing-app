import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import { CreateLibOptions } from "../types/CreateLibOptions"

export default function generate({
  packageName,
  description,
  version = "0.0.0",
  isPrivate = true,
  mainFileName = "src/exports.ts",
}: CreateLibOptions) {
  const packageJson: PackageJson = {
    name: packageName,
    version: version || "0.0.0",
    description: description,
    private: isPrivate,
    main: mainFileName ?? "src/exports.ts",
  }

  return JSON.stringify(packageJson, null, 2)
}
