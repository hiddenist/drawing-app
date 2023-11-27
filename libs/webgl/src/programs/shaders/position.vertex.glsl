attribute vec2 aPosition;

#require "normalizeCoords";

void main() {
  gl_Position = vec4(normalizeCoords(aPosition), 0.0, 1.0);
}
