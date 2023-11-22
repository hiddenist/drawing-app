import { WebGLProgramBuilder } from "../WebGLProgramBuilder"
import positionVertexSource from "./position.vertex.glsl"
import fragmentShaderSource from "./color.fragment.glsl"
import { Color } from "../../classes/Color";

export class Simple2dProgram {
    public readonly program: WebGLProgram;

    constructor(public readonly gl: WebGLRenderingContext) {
        this.program = WebGLProgramBuilder.create(gl, positionVertexSource, fragmentShaderSource)
    }
    
    public setCanvasSize(): Simple2dProgram {
        const canvasSize = this.gl.getUniformLocation(this.program, "canvasSize")
        this.gl.uniform2f(canvasSize, this.gl.canvas.width, this.gl.canvas.height)
        return this
    }

    public prepareBuffer(): WebGLBuffer {
        const buffer = this.gl.createBuffer()
        if (!buffer) {
        throw new Error("Failed to create buffer")
        }
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        this.gl.useProgram(this.program)
        this.gl.enableVertexAttribArray(this.position)
        this.setCanvasSize()

        return buffer
    }
    
    public setColor(color: Color) {
        const colorLocation = this.gl.getUniformLocation(this.program, "color")
        if (!colorLocation) {
        throw new Error("Failed to get color location. Does the specified program have a 'color' uniform?")
        }
        this.gl.uniform4fv(colorLocation, color.toVector4())
    }

    public get position(): number {
        return this.gl.getAttribLocation(this.program, "position")
    }

}