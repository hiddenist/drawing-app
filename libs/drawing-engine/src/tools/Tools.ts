export const ToolNames = {
  brush: "brush",
  eyedropper: "eyedropper",
  eraser: "eraser",
} as const
export type ToolName = (typeof ToolNames)[keyof typeof ToolNames]
