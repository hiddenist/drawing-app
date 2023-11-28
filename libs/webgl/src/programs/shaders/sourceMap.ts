import positionVertexSource from "./position.vertex.glsl"
import colorFragmentSource from "./color.fragment.glsl"
import normalizeCoords from "./inc/normalizeCoords.glsl"

/**
 * A map of shader source code.
 *
 * The keys are the names of the files within the source map.
 * Use the `WebGLProgramBuilder.buildGlslSource` method to recursively build the full source code for a given file.
 */
export default {
  "position.vertex": positionVertexSource,
  "color.fragment": colorFragmentSource,
  normalizeCoords,
}
