precision mediump float;

#define M_PI 3.1415926535897932384626433832795

uniform vec3 uColor;
uniform int uIsPremultipliedAlpha;

varying vec2 vPosition;

#require "softBrush";

void main() {
    float aspect = (uStrokeLength / (2.0 * uStrokeRadiusMax)) + 1.0;

    float U = gl_FragCoord.x - vPosition.x;
    float V = gl_FragCoord.y - vPosition.y;
    float x = U * aspect;
    float y = V;

    float a = alpha(x, y, aspect);

    vec4 color = vec4(uColor / vec3(255.0), a);

    if(uIsPremultipliedAlpha == 1) {
        color.rgb *= color.a;
    }

    gl_FragColor = color;
}
