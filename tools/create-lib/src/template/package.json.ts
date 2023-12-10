import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"
import { CreateLibOptions } from "../types/CreateLibOptions"

export default function generate(options: Required<CreateLibOptions>) {
  const packageJson: PackageJson = {
    name: options.packageName,
    version: options.version,
    description: options.description,
    private: options.isPrivate,
    main: `./src/${options.mainFileName}`,
    scripts: {
      "type-check": "tsc --noEmit",
    },
  }

  return JSON.stringify(packageJson, null, 2)
}
