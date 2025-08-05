import positionVertexSource from "./position.vertex.glsl"
import colorFragmentSource from "./color.fragment.glsl"
import textureVertexSource from "./texture.vertex.glsl"
import textureFragmentSource from "./texture.fragment.glsl"
import brushVertexSource from "./brush.vertex.glsl"
import brushFragmentSource from "./brush.fragment.glsl"
import normalizeCoords from "./inc/normalizeCoords.glsl"
import softBrush from "./inc/softBrush.glsl"

/**
 * A map of shader source code.
 *
 * The keys are the names of the files within the source map.
 * Use the `WebGLProgramBuilder.buildGlslSource` method to recursively build the full source code for a given file.
 */
const sourceMap = {
  "position.vertex": positionVertexSource,
  "color.fragment": colorFragmentSource,
  "texture.vertex": textureVertexSource,
  "texture.fragment": textureFragmentSource,
  "brush.vertex": brushVertexSource,
  "brush.fragment": brushFragmentSource,
  normalizeCoords,
  softBrush,
}
export default sourceMap

type NameMap = Record<keyof typeof sourceMap, Record<string, string>>

// would be neat if I could run something to generate the uniformNames and attributeNames objects from the sourceMap

const reusableUniforms = {
  normalizeCoords: {
    canvasSize: "uCanvasSize",
  },
  softBrush: {
    opacity: "uOpacity",
    strokeRadiusMax: "uStrokeRadiusMax",
    strokeRadiusMin: "uStrokeRadiusMin",
    hardness: "uHardness",
    flow: "uFlow",
    strokeLength: "uStrokeLength",
  },
} as const

export const uniformNames = {
  "position.vertex": {
    ...reusableUniforms.normalizeCoords,
  },
  "color.fragment": {
    color: "uColor",
    opacity: "uOpacity",
  },
  "texture.fragment": {
    foreground: "uForegroundTexture",
    background: "uBackgroundTexture",
    isEraseMode: "uIsEraseMode",
  },
  "brush.vertex": {
    ...reusableUniforms.normalizeCoords,
  },
  "brush.fragment": {
    color: "uColor",
    isPremultipliedAlpha: "uIsPremultipliedAlpha",
    ...reusableUniforms.softBrush,
  },
} as const satisfies Readonly<Partial<NameMap>>

export const attributeNames = {
  "position.vertex": {
    position: "aPosition",
  },
  "texture.vertex": {
    position: "aPosition",
    textureCoordinates: "aTexcoord",
  },
  "brush.vertex": {
    position: "aPosition",
    bounds: "aBounds",
  },
} as const satisfies Readonly<Partial<NameMap>>
