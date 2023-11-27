uniform mat4 uMVPMatrix;
attribute vec2 aPosition;

#require "normalizeCoords";

// todo: untested
void main() {
  gl_Position = uMVPMatrix * vec4(normalizeCoords(aPosition), 0.0, 1.0);
}
