attribute vec2 aPosition;
attribute vec2 aNormal;
// attribute float aMiter;
attribute float aPressure;

// uniform float uThickness;
// uniform mat4 uProjection;
// uniform mat4 uModel;
// uniform mat4 uView;

const float uThickness = 1.0;
const mat4 uProjection = mat4(1.0);
const mat4 uModel = mat4(1.0);
const mat4 uView = mat4(1.0);
const float aMiter = 1.0;

varying float vAlpha;
varying float vEdge;

#require "normalizeCoords";

void main() {
    if(aPressure > 0.0) {
        vAlpha = aPressure;
    } else {
        vAlpha = 1.0;
    }

    vEdge = sign(aMiter);
    vec2 normalizedPosition = normalizeCoords(aPosition);

    vec2 position = normalizedPosition.xy + vec2(aNormal * uThickness / 2.0 * aMiter);
    gl_Position = uProjection * uView * uModel * vec4(position, 0.0, 1.0);

    gl_PointSize = 1.0;
}
