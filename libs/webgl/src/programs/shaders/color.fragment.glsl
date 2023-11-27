precision mediump float;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor / vec4(255.0);
}
