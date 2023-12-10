attribute vec2 aPosition;
attribute vec2 aTexcoord;

varying vec2 vTexcoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexcoord = aTexcoord;
}
