import positionVertexSource from "./position.vertex.glsl"
import colorFragmentSource from "./color.fragment.glsl"
import bezierFragmentSource from "./bezier.vertex.glsl"
import normalizeCoords from "./inc/normalizeCoords.glsl"
import lineFragmentSource from "./lines.fragment.glsl"
import lineVertexSource from "./lines.vertex.glsl"

/**
 * A map of shader source code.
 *
 * The keys are the names of the files within the source map.
 * Use the `WebGLProgramBuilder.buildGlslSource` method to recursively build the full source code for a given file.
 */
export default {
  "position.vertex": positionVertexSource,
  "color.fragment": colorFragmentSource,
  "bezier.vertex": bezierFragmentSource,
  "lines.fragment": lineFragmentSource,
  "lines.vertex": lineVertexSource,
  normalizeCoords,
}
