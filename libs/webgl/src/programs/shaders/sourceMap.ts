import positionVertexSource from "./position.vertex.glsl"
import fragmentShaderSource from "./color.fragment.glsl"
import normalizeCoords from "./inc/normalizeCoords.glsl"

export default {
  "position.vertex": positionVertexSource,
  "color.fragment": fragmentShaderSource,
  normalizeCoords,
}
