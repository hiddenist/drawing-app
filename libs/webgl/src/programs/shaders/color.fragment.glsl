precision mediump float;
uniform vec4 uColor;

void main() {
  gl_FragColor = uColor / vec4(255.0);
  gl_FragColor.a = 0.9;
}
