precision mediump float;

varying vec2 v_resolution;

void main() {
  vec2 st = gl_FragCoord.xy / v_resolution;

  vec3 rgb = clamp(abs(mod(st.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);

  if(st.y > 0.5) {
    vec3 fadeToWhite = vec3(1.0) - (1.0 - rgb) * (1.0 - st.y) * 2.0;
    gl_FragColor = vec4(fadeToWhite, 1.0);
  } else {
    vec3 fadeToBlack = rgb * st.y * 2.0;
    gl_FragColor = vec4(fadeToBlack, 1.0);
  }

}