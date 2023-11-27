#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 uColor;
uniform float uInner;
varying float vEdge;

void main() {
    float v = 1.0 - abs(vEdge);
    v = smoothstep(0.65, 0.7, v * uInner);

    vec4 color = uColor / vec4(255.0);
    vec4 color2 = vec4(color.rgb, 0);
    gl_FragColor = mix(color, color2, v);
}