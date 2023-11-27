attribute vec2 aPosition;
attribute vec2 aNormal;
attribute float aMiter;

uniform float uThickness;
uniform vec4 uProjection;
uniform vec4 uModel;
uniform vec4 uView;

varying float vEdge;

#require "normalizeCoords";

void main() {
    float thickness = uThickness;
    if(thickness <= 0.0) {
        thickness = 20.0;
    }

    vEdge = sign(aMiter);
    vec2 normalizedPosition = normalizeCoords(aPosition);

    vec2 position = normalizedPosition.xy + vec2(aNormal * thickness / 20.0 * aMiter);
    gl_Position = uProjection * uView * uModel * vec4(position, 0.0, 1.0);

    gl_PointSize = thickness * 100.0;
}
