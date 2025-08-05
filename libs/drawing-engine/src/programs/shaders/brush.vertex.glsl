attribute vec2 aPosition;
attribute vec2 aBounds;

#require "normalizeCoords";

varying vec2 vPosition;

void main() {
  vPosition = normalizeCoords(aPosition);

  gl_Position = vec4(aBounds, 0.0, 1.0);
}
