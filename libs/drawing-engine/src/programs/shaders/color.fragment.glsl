#version 300 es
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
out vec4 fragColor;

void main() {
  fragColor = vec4(uColor, uOpacity) / vec4(255.0);
}
