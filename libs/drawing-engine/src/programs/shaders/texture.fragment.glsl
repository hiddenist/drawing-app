#version 300 es
precision mediump float;

uniform sampler2D uForegroundTexture;
uniform sampler2D uBackgroundTexture;
uniform bool uIsEraseMode;

in vec2 vTexcoord;
out vec4 fragColor;

void main() {
    vec4 foreground = texture(uForegroundTexture, vTexcoord);
    vec4 background = texture(uBackgroundTexture, vTexcoord);

    if(uIsEraseMode) {
        foreground = vec4(0.0, 0.0, 0.0, foreground.a);
        fragColor = background * (1.0 - foreground.a);
    } else {
        foreground.rgb *= foreground.a;
        // Blend the colors
        fragColor = foreground + background * (1.0 - foreground.a);
    }
}
