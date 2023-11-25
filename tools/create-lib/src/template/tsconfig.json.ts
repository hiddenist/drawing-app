import { JSONSchemaForTheTypeScriptCompilerSConfigurationFile as TsConfig } from "@schemastore/tsconfig"
import { CreateLibOptions } from "../types/CreateLibOptions"

export default function generate(_options: CreateLibOptions) {
  const config: TsConfig = {
    extends: "../../tsconfig.json",
    include: ["src", "../../declarations.d.ts"],
  }
  return JSON.stringify(config, null, 2)
}
