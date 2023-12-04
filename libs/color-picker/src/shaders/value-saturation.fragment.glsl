precision mediump float;

uniform float uHue;
uniform vec3 uSelectedColor;

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

vec3 rgb2hsv(vec3 rgb) {
  float cmax = max(rgb.r, max(rgb.g, rgb.b));
  float cmin = min(rgb.r, min(rgb.g, rgb.b));
  float delta = cmax - cmin;

  float hue = 0.0;
  float sat = 0.0;
  float val = cmax;

  if(delta != 0.0) {
    if(cmax == rgb.r) {
      hue = 60.0 * mod((rgb.g - rgb.b) / delta, 6.0);
    } else if(cmax == rgb.g) {
      hue = 60.0 * ((rgb.b - rgb.r) / delta + 2.0);
    } else {
      hue = 60.0 * ((rgb.r - rgb.g) / delta + 4.0);
    }

    if(cmax != 0.0) {
      sat = delta / cmax;
    }
  }

  return vec3(hue, sat, val);
}

float luminance(vec3 color) {
  vec3 adjustedColor = color / vec3(255.0);
  return 0.2126 * adjustedColor.r + 0.7152 * adjustedColor.g + 0.0722 * adjustedColor.b;
}

vec3 drawCurrentPositionMarker(vec3 color, float markerDiameter, float markerLineWidth) {
  if(uSelectedColor.x < 0.0) {
    return color;
  }
  vec3 hsv = rgb2hsv(uSelectedColor);
  vec2 pos = vec2(hsv.y, hsv.z / 255.0) * vec2(vResolution);

  float dx = abs(gl_FragCoord.x - pos.x);
  float dy = abs(gl_FragCoord.y - pos.y);

  float distOut = floor(markerDiameter / 2.0);
  float distIn = distOut - markerLineWidth;

  bool inX = dx > distIn && dx < distOut && (dy < distOut);
  bool inY = dy > distIn && dy < distOut && (dx < distOut);

  if(!(inX || inY)) {
    return color;
  }

  float lum = luminance(uSelectedColor);
  if(lum < 0.5) {
    return vec3(1.0, 1.0, 1.0);
  }
  return vec3(0.0, 0.0, 0.0);

}

void main() {
  vec2 st = gl_FragCoord.xy / vResolution;

  vec3 hsv = vec3(mod(uHue, 360.0), st.x, st.y);
  vec3 rgb = hsv2rgb(hsv);

  gl_FragColor = vec4(drawCurrentPositionMarker(rgb, 7.0, 1.0), 1.0);
}
