precision mediump float;

uniform float uHue;

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

void main() {
  vec2 st = gl_FragCoord.xy / vResolution;

  vec3 hsv = vec3(mod(uHue, 360.0), st.x, st.y);
  vec3 rgb = hsv2rgb(hsv);

  gl_FragColor = vec4(rgb, 1.0);
}
