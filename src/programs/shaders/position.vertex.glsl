attribute vec2 position;

uniform vec2 canvasSize;

vec2 normalizeCoords(vec2 coords) {
  float x = coords.x / canvasSize.x * 2.0 - 1.0;
  float y = coords.y / canvasSize.y * -2.0 + 1.0;
  return vec2(x, y);
}

void main() {
  gl_Position = vec4(
    normalizeCoords(position),
    0.0, 
    1.0
  );
}
