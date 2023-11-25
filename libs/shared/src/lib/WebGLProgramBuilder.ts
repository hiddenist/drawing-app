export class WebGLProgramBuilder {
  protected vertexShader: WebGLShader
  protected fragmentShader: WebGLShader

  protected constructor(
    protected readonly gl: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ) {
    this.gl = gl
    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER)
    this.fragmentShader = this.createShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
  }

  public static create(
    gl: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ): WebGLProgram {
    const builder = new WebGLProgramBuilder(gl, vertexShaderSource, fragmentShaderSource)
    return builder.createProgram()
  }

  protected createProgram(): WebGLProgram {
    const program = this.gl.createProgram()
    if (!program) {
      throw new Error("Failed to create program")
    }
    this.gl.attachShader(program, this.vertexShader)
    this.gl.attachShader(program, this.fragmentShader)
    this.gl.linkProgram(program)
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error("Failed to link program: " + this.gl.getProgramInfoLog(program))
    }
    return program
  }

  protected createShader(source: string, type: number): WebGLShader {
    const shader = this.gl.createShader(type)
    if (!shader) {
      throw new Error("Failed to create shader")
    }
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error("Failed to compile shader: " + this.gl.getShaderInfoLog(shader))
    }
    return shader
  }
}
