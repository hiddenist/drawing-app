precision mediump float;

uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;

varying vec2 vTexcoord;

void main() {
    vec4 foreground = texture2D(uForegroundTexture, vTexcoord);
    vec4 background = texture2D(uBackgroundTexture, vTexcoord);

    // Unpremultiply alpha
    foreground.rgb *= foreground.a;

    // Blend colors
    gl_FragColor = foreground + background * (1.0 - foreground.a);

}
