attribute vec2 aPosition;

uniform vec2 uResolution;

varying vec2 vResolution;

void main() {
  vResolution = uResolution;
  gl_Position = vec4(aPosition, 1.0, 1.0);
}
