precision mediump float;

uniform float uSaturation;

varying vec2 vResolution;

vec3 rgb2hsv(vec3 rgb) {

  float hue = 0.0;
  float sat = 0.0;
  float val = 0.0;

  float cmax = max(rgb.r, max(rgb.g, rgb.b));
  float cmin = min(rgb.r, min(rgb.g, rgb.b));
  float delta = cmax - cmin;

  if(delta > 0.0) {
    if(cmax == rgb.r) {
      hue = mod((rgb.g - rgb.b) / delta, 6.0);
    } else if(cmax == rgb.g) {
      hue = (rgb.b - rgb.r) / delta + 2.0;
    } else {
      hue = (rgb.r - rgb.g) / delta + 4.0;
    }

    if(cmax > 0.0) {
      sat = delta / cmax;
    } else {
      sat = 0.0;
    }

    val = cmax;
  } else {
    hue = 0.0;
    sat = 0.0;
    val = cmax;
  }

  return vec3(hue * 60.0, sat, val);
}

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

void main() {
  float saturation = uSaturation / 100.0;
  vec2 st = gl_FragCoord.xy / vResolution;

  vec3 rgb = clamp(abs(mod(st.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

  vec3 hsv = rgb2hsv(rgb);

  hsv.y = saturation;

  rgb = hsv2rgb(hsv);

  if(st.y > 0.5) {
    vec3 fadeToWhite = vec3(1.0) - (1.0 - rgb) * (1.0 - st.y) * 2.0;
    gl_FragColor = vec4(fadeToWhite, 1.0);
  } else {
    vec3 fadeToBlack = rgb * st.y * 2.0;
    gl_FragColor = vec4(fadeToBlack, 1.0);
  }
}
