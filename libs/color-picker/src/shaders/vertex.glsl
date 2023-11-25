attribute vec2 a_position;
uniform vec2 u_resolution;

varying vec2 v_resolution;

void main() {
  v_resolution = u_resolution;
  gl_Position = vec4(a_position, 1.0, 1.0);
}
