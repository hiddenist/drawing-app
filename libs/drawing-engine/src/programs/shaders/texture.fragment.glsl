precision mediump float;

uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;
uniform bool uIsEraseMode;

varying vec2 vTexcoord;

void main() {
    vec4 foreground = texture2D(uForegroundTexture, vTexcoord);
    vec4 background = texture2D(uBackgroundTexture, vTexcoord);

    if(uIsEraseMode) {
        foreground = vec4(0.0, 0.0, 0.0, foreground.a);
        gl_FragColor = background * (1.0 - foreground.a);
    } else {
        foreground.rgb *= foreground.a;
        // Blend the colors
        gl_FragColor = foreground + background * (1.0 - foreground.a);
    }
}
