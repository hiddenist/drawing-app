uniform vec2 uCanvasSize;

vec2 normalizeCoords(vec2 coords) {
  float x = coords.x / uCanvasSize.x * 2.0 - 1.0;
  float y = coords.y / uCanvasSize.y * -2.0 + 1.0;
  return vec2(x, y);
}
