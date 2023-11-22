import { WebGLProgramBuilder } from "../WebGLProgramBuilder"
import positionVertexSource from "./position.vertex.glsl"
import fragmentShaderSource from "./color.fragment.glsl"

export class Simple2dProgram {
    public readonly program: WebGLProgram;

    constructor(gl: WebGLRenderingContext) {
        this.program = WebGLProgramBuilder.create(gl, positionVertexSource, fragmentShaderSource)
    }
    
    public setCanvasSize(gl: WebGLRenderingContext): Simple2dProgram {
        const width = gl.getUniformLocation(this.program, "width")
        const height = gl.getUniformLocation(this.program, "height")
        gl.uniform1f(width, gl.canvas.width)
        gl.uniform1f(height, gl.canvas.height)
        return this
    }
}