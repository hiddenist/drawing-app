precision mediump float;

uniform float uHue;
uniform vec3 uSelectedColor;
uniform vec2 uMarkerPosition;

varying vec2 vResolution;

vec3 hsv2rgb(vec3 hsv) {
  float hue = hsv.x / 60.0;
  float sat = hsv.y;
  float val = hsv.z;

  float c = val * sat;
  float x = c * (1.0 - abs(mod(hue, 2.0) - 1.0));
  float m = val - c;

  vec3 rgb;

  if(hue >= 0.0 && hue < 1.0) {
    rgb = vec3(c, x, 0.0);
  } else if(hue >= 1.0 && hue < 2.0) {
    rgb = vec3(x, c, 0.0);
  } else if(hue >= 2.0 && hue < 3.0) {
    rgb = vec3(0.0, c, x);
  } else if(hue >= 3.0 && hue < 4.0) {
    rgb = vec3(0.0, x, c);
  } else if(hue >= 4.0 && hue < 5.0) {
    rgb = vec3(x, 0.0, c);
  } else {
    rgb = vec3(c, 0.0, x);
  }

  return rgb + m;
}

float luminance(vec3 color) {
  vec3 adjustedColor = color / vec3(255.0);
  return 0.2126 * adjustedColor.r + 0.7152 * adjustedColor.g + 0.0722 * adjustedColor.b;
}

bool isOnMarkerLine(vec2 pos, float markerDiameter, float markerWidth) {
  float dx = abs(gl_FragCoord.x - pos.x);
  float dy = abs(gl_FragCoord.y - pos.y);

  float distOut = floor(markerDiameter / 2.0);
  float distIn = distOut - markerWidth;

  bool inX = dx > distIn && dx < distOut && (dy < distOut);
  bool inY = dy > distIn && dy < distOut && (dx < distOut);

  return inX || inY;
}

vec3 getContrastingColor(vec3 color) {
  float lum = luminance(color);
  if(lum < 0.5) {
    return vec3(1.0, 1.0, 1.0);
  }
  return vec3(0.0, 0.0, 0.0);
}

vec3 drawMarker(vec3 backgroundColor, vec2 pos, float markerDiameter, float markerWidth) {
  vec2 mirrorY = vec2(pos.x, vResolution.y - pos.y);
  if(isOnMarkerLine(mirrorY, markerDiameter, markerWidth)) {
    return getContrastingColor(uSelectedColor);
  }
  return backgroundColor;
}

void main() {
  vec2 st = gl_FragCoord.xy / vResolution;

  vec3 hsv = vec3(mod(uHue, 360.0), st.x, st.y);
  vec3 rgb = hsv2rgb(hsv);

  gl_FragColor = vec4(drawMarker(rgb, uMarkerPosition, 7.0, 1.0), 1.0);
}
