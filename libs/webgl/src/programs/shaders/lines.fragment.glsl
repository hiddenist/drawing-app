#ifdef GL_ES
precision mediump float;
#endif

uniform vec4 uColor;
uniform float uInner;
varying float vEdge;
varying float vAlpha;

void main() {
    float v = 1.0 - abs(vEdge);
    v = smoothstep(0.65, 0.7, v * uInner);

    vec4 color = vec4(uColor.xyz, uColor.w * vAlpha);
    gl_FragColor = mix(color, vec4(0.0), v);
}