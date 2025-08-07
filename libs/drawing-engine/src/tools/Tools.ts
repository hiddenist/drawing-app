export const ToolNames = {
  brush: "brush",
  softBrush: "softBrush",
  eyedropper: "eyedropper",
  eraser: "eraser",
} as const
export type ToolName = (typeof ToolNames)[keyof typeof ToolNames]
