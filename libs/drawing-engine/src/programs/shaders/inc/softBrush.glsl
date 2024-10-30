// Credit: https://jcgt.org/published/0007/01/01/paper.pdf

uniform float uOpacity;
uniform float uStrokeRadiusMax;
uniform float uStrokeRadiusMin;
uniform vec2 uHardness;
uniform vec2 uFlow;
uniform float uStrokeLength;

float psi(float x) {
    return (uStrokeRadiusMax * (2.0 * x - 1.0)) / uStrokeLength;
}

float flow(float x) {
    // mix = lerp
    return mix(uFlow[0], uFlow[1], psi(x));
}

float hardness(float x) {
    return mix(uHardness[0], uHardness[1], psi(x));
}

float radius(float x) {
    return mix(0.5, uStrokeRadiusMin / (2.0 * uStrokeRadiusMax), psi(x));
}

float dist(float x, float X, float Y) {
    return sqrt(pow(X - x, 2.0) + pow(Y - 0.5, 2.0));
}

float theta(float x, float X, float Y) {
    return dist(x, X, Y) / radius(x);
}

float phase(float x) {
    return M_PI / 2.0 * (1.0 - (1.0 / (1.0 - hardness(x))));
}

float falloff(float x, float X, float Y) {
    if(theta(x, X, Y) < hardness(x)) {
        return 1.0;
    } else {
        float piTheta = M_PI * theta(x, X, Y);
        float iHardness = 1.0 - hardness(x);
        return pow(cos(piTheta / (2.0 * iHardness) + phase(x)), 2.0);
    }
}

float alpha(float X, float Y, float aspect) {
    float BE = abs(Y - 0.5);
    float BD = radius(X);
    float BO = (uStrokeLength * BD) / (uStrokeRadiusMax - uStrokeRadiusMin);
    float lambda = pow(BD, 2.0) - ((pow(BD, 2.0) * pow(BE, 2.0)) / pow(BO, 2.0));
    float epsilon = pow(4.0 * pow(BD, 4.0), 4.0) / pow(BO, 2.0);
    float r1 = 0.0;
    float r2 = 0.0;

    if(uStrokeRadiusMin == uStrokeRadiusMax) {
        r1 = 0.25;
        r2 = 0.25;
    } else {
        // breaks down the quadratic formula into parts so I can look at it without going crazy
        float a = (2.0 * lambda) + epsilon;

        // I pulled the negative out of b and c to make them easier to read
        // it's reintroduced in d
        float b = pow(lambda, 2.0) + (epsilon * pow(BE, 2.0));
        float c = a + (4.0 * b);
        float d = sqrt(-4.0 * c);

        r1 = (a + d) / 2.0;
        r2 = (a - d) / 2.0;
    }

    float X1 = clamp(X - sqrt(r1 - pow(BE, 2.0)), 0.5, aspect - 0.5);
    float X2 = clamp(X + sqrt(r2 - pow(BE, 2.0)), 0.5, aspect - 0.5);

    float sum = 0.0;

    // Approximate integral
    const float dx = 0.001;

    for(float i = 0.0; i < 1.0; i += dx) {
        float x = mix(X1, X2, i);
        sum += flow(x) * falloff(x, X, Y) * dx;
    }

    return min(uOpacity / 255.0, 2.0 * uStrokeRadiusMax * sum);
}
