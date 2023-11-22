import { WebGLProgramBuilder } from "../WebGLProgramBuilder"
import positionVertexSource from "../../shaders/position.vertex.glsl"
import fragmentShaderSource from "../../shaders/color.fragment.glsl"

export class Simple2dProgram {
    public readonly program: WebGLProgram;

    constructor(gl: WebGLRenderingContext) {
        this.program = WebGLProgramBuilder.create(gl, positionVertexSource, fragmentShaderSource)
    }
}