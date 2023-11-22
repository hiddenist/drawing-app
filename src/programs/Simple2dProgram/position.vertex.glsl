attribute vec2 position;

uniform vec2 canvasSize;

void main() {
  gl_Position = vec4(
    (position / canvasSize) * 2.0 - 1.0,
    0.0, 
    1.0
  );
}

// 500/500 = 1 => 1 - 1 = 0
// 0/500 = 0 => 0 - 1 = -1
// 500, 500 => 1, 1
