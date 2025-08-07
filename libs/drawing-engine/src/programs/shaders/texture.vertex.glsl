#version 300 es
in vec2 aPosition;
in vec2 aTexcoord;

out vec2 vTexcoord;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vTexcoord = aTexcoord;
}
