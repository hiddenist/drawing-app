import positionVertexSource from "./position.vertex.glsl"
import colorFragmentSource from "./color.fragment.glsl"
import textureVertexSource from "./texture.vertex.glsl"
import textureFragmentSource from "./texture.fragment.glsl"
import softVertexSource from "./soft.vertex.glsl"
import softFragmentSource from "./soft.fragment.glsl"
import normalizeCoords from "./inc/normalizeCoords.glsl"

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
  "soft.vertex": softVertexSource,
  "soft.fragment": softFragmentSource,
  normalizeCoords,
}
export default sourceMap

type NameMap = Record<keyof typeof sourceMap, Record<string, string>>

// would be neat if I could run something to generate the uniformNames and attributeNames objects from the sourceMap

const includableScripts = {
  normalizeCoords: {
    source: normalizeCoords,
    uniforms: {
      canvasSize: "uCanvasSize",
    },
  },
} as const

export const uniformNames = {
  "position.vertex": {
    ...includableScripts.normalizeCoords.uniforms,
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
  "soft.vertex": {},
  "soft.fragment": {
    strokeData: "u_strokeData",
    numPoints: "u_numPoints",
    opacity: "u_opacity",
    color: "u_color",
    canvasSize: "u_canvasSize",
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
  "soft.vertex": {
    position: "a_position",
    texCoord: "a_texCoord",
  },
} as const satisfies Readonly<Partial<NameMap>>
