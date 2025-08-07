#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_strokeData;  // Texture containing all stroke points
uniform int u_numPoints;
uniform float u_opacity;
uniform vec3 u_color;
uniform vec2 u_canvasSize;

#define PI 3.14159265359
#define INTEGRATION_SAMPLES 128

// Get stroke data from texture
vec4 getStrokeData(int index) {
    // Each texel: xy = position, z = radius, w = hardness
    return texelFetch(u_strokeData, ivec2(index, 0), 0);
}

// Get flow data from second row of texture
vec2 getFlowData(int index) {
    // x = flow value, y = unused
    return texelFetch(u_strokeData, ivec2(index, 1), 0).xy;
}

// Paper's squared-cosine falloff function
float falloff(float dist, float radius, float hardness) {
    float phi = dist / radius;
    
    if (phi >= 1.0) return 0.0;
    if (phi < hardness) return 1.0;
    
    if (hardness >= 0.99) return 0.0;
    
    // Exact formula from the paper
    float phase = (PI / 2.0) * (1.0 - 1.0 / (1.0 - hardness));
    float angle = (PI * phi) / (2.0 * (1.0 - hardness)) + phase;
    return pow(cos(angle), 2.0);
}

// Calculate contribution from a polyline stroke using continuous integration
float calculateStrokeContribution(vec2 pixel) {
    float totalContribution = 0.0;
    
    // For each segment in the stroke
    for (int i = 0; i < u_numPoints - 1; i++) {
        vec4 data1 = getStrokeData(i);
        vec4 data2 = getStrokeData(i + 1);
        vec2 flow1 = getFlowData(i);
        vec2 flow2 = getFlowData(i + 1);
        
        vec2 p1 = data1.xy;
        vec2 p2 = data2.xy;
        
        vec2 segment = p2 - p1;
        float segLength = length(segment);
        
        if (segLength < 0.001) {
            // Handle single point
            float dist = distance(pixel, p1);
            totalContribution += falloff(dist, data1.z, data1.w) * flow1.x * 0.1;
            continue;
        }
        
        vec2 segDir = segment / segLength;
        
        // Project pixel onto line segment
        vec2 toPixel = pixel - p1;
        float projection = dot(toPixel, segDir);
        
        // Clamp to segment bounds
        projection = clamp(projection, 0.0, segLength);
        
        // Find closest point on segment
        vec2 closestPoint = p1 + segDir * projection;
        float perpDist = distance(pixel, closestPoint);
        
        // Parameter along segment (0 to 1)
        float t = projection / segLength;
        
        // Interpolate brush parameters
        float radius = mix(data1.z, data2.z, t);
        float hardness = mix(data1.w, data2.w, t);
        float flow = mix(flow1.x, flow2.x, t);
        
        // Skip if pixel is outside brush radius
        if (perpDist > radius) continue;
        
        // Calculate brush contribution at this point
        float brushValue = falloff(perpDist, radius, hardness);
        
        // Integrate along the segment
        // The key insight: we need to integrate the brush function
        // along the portion of the segment that affects this pixel
        
        // Find the range along the segment where the brush touches this pixel
        float halfChord = sqrt(max(0.0, radius * radius - perpDist * perpDist));
        float t1 = (projection - halfChord) / segLength;
        float t2 = (projection + halfChord) / segLength;
        t1 = clamp(t1, 0.0, 1.0);
        t2 = clamp(t2, 0.0, 1.0);
        
        float integrationLength = (t2 - t1) * segLength;
        
        // Scale contribution based on brush size
        // Smaller brushes need less aggressive accumulation to preserve softness
        float sizeScale = 1.0 / (1.0 + radius * 0.05);
        
        // The contribution is proportional to the length of the segment
        // that passes through this pixel's brush radius
        totalContribution += brushValue * flow * integrationLength * sizeScale;
    }
    
    // Normalize with size-aware scaling
    // Smaller brushes get less normalization to preserve their falloff
    float avgRadius = 0.0;
    for (int i = 0; i < u_numPoints; i++) {
        vec4 data = getStrokeData(i);
        avgRadius += data.z;
    }
    avgRadius = avgRadius / float(u_numPoints);
    
    // Dynamic normalization based on average brush size
    float normFactor = 0.2 + 0.3 * (avgRadius / 50.0);
    return totalContribution * normFactor;
}

// Catmull-Rom spline interpolation (keeping as fallback)
vec2 catmullRom(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    
    // Lower tension for even smoother curves
    float tension = 0.5;
    
    vec2 v0 = (p2 - p0) * tension;
    vec2 v1 = (p3 - p1) * tension;
    
    return p1 + v0 * t + 
            (3.0 * (p2 - p1) - 2.0 * v0 - v1) * t2 +
            (2.0 * (p1 - p2) + v0 + v1) * t3;
}

// Calculate contribution from a curved segment using Catmull-Rom interpolation
float calculateCurvedSegmentContribution(vec2 pixel, 
                                        vec2 p0, vec2 p1, vec2 p2, vec2 p3,
                                        float r1, float r2, 
                                        float h1, float h2,
                                        float f1, float f2) {
    // Estimate arc length for proper sampling
    float chordLength = distance(p1, p2);
    vec2 mid1 = catmullRom(p0, p1, p2, p3, 0.33);
    vec2 mid2 = catmullRom(p0, p1, p2, p3, 0.67);
    float arcLength = distance(p1, mid1) + distance(mid1, mid2) + distance(mid2, p2);
    
    if (arcLength < 0.001) {
        float dist = distance(pixel, p1);
        return falloff(dist, r1, h1) * f1;
    }
    
    // Quick bounds check
    float maxRadius = max(r1, r2);
    vec2 minBounds = min(min(p1, p2), min(mid1, mid2)) - vec2(maxRadius);
    vec2 maxBounds = max(max(p1, p2), max(mid1, mid2)) + vec2(maxRadius);
    if (pixel.x < minBounds.x || pixel.x > maxBounds.x || 
        pixel.y < minBounds.y || pixel.y > maxBounds.y) {
        return 0.0;
    }
    
    // Sample along the curve with higher density for smoother rendering
    float contribution = 0.0;
    int samples = max(8, min(INTEGRATION_SAMPLES, int(arcLength) + 8));
    float dt = 1.0 / float(samples - 1);
    
    for (int i = 0; i < samples; i++) {
        float t = float(i) * dt;
        vec2 samplePos = catmullRom(p0, p1, p2, p3, t);
        float sampleRadius = mix(r1, r2, t);
        float sampleHardness = mix(h1, h2, t);
        float sampleFlow = mix(f1, f2, t);
        
        float dist = distance(pixel, samplePos);
        float falloffValue = falloff(dist, sampleRadius, sampleHardness);
        
        contribution += falloffValue * sampleFlow * (arcLength / float(samples - 1));
    }
    
    return contribution;
}

// Original linear segment contribution (kept as fallback)
float calculateSegmentContribution(vec2 pixel, vec2 p1, vec2 p2, 
                                    float r1, float r2, 
                                    float h1, float h2,
                                    float f1, float f2) {
    vec2 dir = p2 - p1;
    float segLength = length(dir);
    
    if (segLength < 0.001) {
        // Single point
        float dist = distance(pixel, p1);
        return falloff(dist, r1, h1) * f1 * 2.0 * r1;
    }
    
    dir = dir / segLength;
    
    // Project pixel onto line segment
    vec2 toPixel = pixel - p1;
    float projection = dot(toPixel, dir);
    projection = clamp(projection, 0.0, segLength);
    
    // Find perpendicular distance
    vec2 closest = p1 + dir * projection;
    float perpDist = distance(pixel, closest);
    
    // Check if pixel is within maximum radius
    float t = projection / segLength;
    float maxRadius = mix(r1, r2, t);
    if (perpDist > maxRadius) return 0.0;
    
    // Integrate along the segment
    // Find integration bounds where the stroke affects this pixel
    float contribution = 0.0;
    int samples = min(INTEGRATION_SAMPLES, int(segLength) + 4);
    float dt = 1.0 / float(samples - 1);
    
    for (int i = 0; i < samples; i++) {
        float s = float(i) * dt;
        vec2 samplePos = mix(p1, p2, s);
        float sampleRadius = mix(r1, r2, s);
        float sampleHardness = mix(h1, h2, s);
        float sampleFlow = mix(f1, f2, s);
        
        float dist = distance(pixel, samplePos);
        float weight = falloff(dist, sampleRadius, sampleHardness) * sampleFlow;
        
        // Simpson's rule weights
        float simpsonWeight = 1.0;
        if (i > 0 && i < samples - 1) {
            simpsonWeight = (i % 2 == 0) ? 2.0 : 4.0;
        }
        
        contribution += weight * simpsonWeight;
    }
    
    // Complete Simpson's rule
    contribution *= (segLength * dt) / 3.0;
    
    // Simple normalization that preserves the falloff
    // Just normalize by the number of samples to maintain the falloff shape
    contribution = contribution / float(samples);
    
    return contribution;
}

void main() {
    // Convert from texture coordinates to canvas pixel coordinates
    // v_texCoord is in [0,1] range, flip Y to match canvas coordinate system
    vec2 pixelPos = vec2(v_texCoord.x * u_canvasSize.x, (1.0 - v_texCoord.y) * u_canvasSize.y);
    float totalAlpha = 0.0;
    
    if (u_numPoints == 1) {
        // Single dot
        vec4 data = getStrokeData(0);
        vec2 flowData = getFlowData(0);
        float dist = distance(pixelPos, data.xy);
        totalAlpha = falloff(dist, data.z, data.w) * flowData.x;
    } else if (u_numPoints > 1) {
        // Calculate contribution from the entire continuous stroke
        totalAlpha = calculateStrokeContribution(pixelPos);
    }
    
    // Apply opacity as a cap (not a multiplier)
    // Convert opacity from 0-255 to 0-1 range
    float normalizedOpacity = u_opacity / 255.0;
    totalAlpha = min(normalizedOpacity, totalAlpha);
    
    if (totalAlpha < 0.001) {
        discard;
    }
    
    fragColor = vec4(u_color * totalAlpha, totalAlpha);
}