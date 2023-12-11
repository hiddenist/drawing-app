export const ToolNames = {
  line: "line",
  eyedropper: "eyedropper",
} as const
export type ToolName = (typeof ToolNames)[keyof typeof ToolNames]
