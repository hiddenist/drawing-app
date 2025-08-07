export const ToolNames = {
  brush: "brush",
  softBrush: "softBrush",
  eyedropper: "eyedropper",
  eraser: "eraser",
  softEraser: "softEraser",
} as const
export type ToolName = (typeof ToolNames)[keyof typeof ToolNames]
