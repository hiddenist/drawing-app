precision mediump float;

uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;

varying vec2 vTexcoord;

void main() {
    vec4 foreground = texture2D(uForegroundTexture, vTexcoord);
    vec4 background = texture2D(uBackgroundTexture, vTexcoord);

    gl_FragColor = foreground * foreground.a + background * (1.0 - foreground.a);
}
