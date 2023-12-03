export interface ProgramInfo<UniformNames extends string, AttributeNames extends string> {
  gl: WebGLRenderingContext
  program: WebGLProgram
  uniforms: Record<UniformNames, WebGLUniformLocation>
  attributes: Record<
    AttributeNames,
    {
      location: number
      buffer?: WebGLBuffer | null
    }
  >
}

export type AttributeInfo = {
  location: number
  buffer?: WebGLBuffer | null
}

export interface IBaseProgram {
  readonly gl: WebGLRenderingContext
  useProgram(): this
  syncCanvasSize(): this
  getCanvasSize(): { width: number; height: number }
  checkError(): this
}

export abstract class BaseProgram<
  UniformNames extends string,
  AttributeNames extends string,
  ExtendableProgramInfo extends ProgramInfo<UniformNames, AttributeNames> = ProgramInfo<UniformNames, AttributeNames>,
> implements IBaseProgram
{
  constructor(
    private readonly _programInfo: ExtendableProgramInfo,
    private _pixelDensity = 1,
  ) {}

  public get pixelDensity() {
    return this._pixelDensity
  }

  public set pixelDensity(value: number) {
    this._pixelDensity = value
    this.syncCanvasSize()
  }

  protected abstract createProgramInfo(context: WebGLRenderingContext, program: WebGLProgram): ExtendableProgramInfo

  protected static getProgramInfo<UniformNames extends string, AttributeNames extends string>(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    uniformNames: Record<UniformNames, string>,
    attributeNames: Record<AttributeNames, string>,
  ): ProgramInfo<UniformNames, AttributeNames> {
    const uniforms: Record<string, WebGLUniformLocation> = {}
    const attributes: Record<string, AttributeInfo> = {}

    for (const [key, value] of Object.entries(uniformNames)) {
      uniforms[key] = BaseProgram._getUniformLocationOrThrow(value as string, gl, program)
    }

    for (const [key, value] of Object.entries(attributeNames)) {
      attributes[key as AttributeNames] = {
        location: gl.getAttribLocation(program, value as string),
      }
    }

    return {
      gl,
      program,
      uniforms: uniforms as Record<UniformNames, WebGLUniformLocation>,
      attributes: attributes as Record<AttributeNames, AttributeInfo>,
    }
  }

  public get gl(): WebGLRenderingContext {
    return this._programInfo.gl
  }

  public useProgram(): this {
    this.gl.useProgram(this.program)
    return this
  }

  public syncCanvasSize(): typeof this {
    const { width, height } = this.getCanvasSize()
    this.gl.viewport(0, 0, width, height)
    return this
  }

  // todo: refactor out the canvas size logic from the program and base program so that it doesn't rely on HTMLElements
  public getCanvasSize(): { width: number; height: number } {
    const canvas = this.gl.canvas
    if (!(canvas instanceof HTMLElement)) {
      throw new Error("Could not get canvas size, canvas is not an HTMLCanvasElement")
    }
    const boundingRect = canvas.getBoundingClientRect()

    return { width: boundingRect.width * this.pixelDensity, height: boundingRect.height * this.pixelDensity }
  }

  public checkError(): typeof this {
    const error = this.gl.getError()
    if (error !== WebGLRenderingContext.NO_ERROR) {
      debugger
      throw new Error("WebGL error: " + error)
    }
    return this
  }

  protected get program(): WebGLProgram {
    if (!this._programInfo) {
      throw new Error("No context is set")
    }
    return this._programInfo.program
  }

  protected abstract createProgram(context: WebGLRenderingContext): WebGLProgram

  protected getUniformLocation(name: UniformNames): WebGLUniformLocation {
    return this._programInfo.uniforms[name]
  }

  protected getAttribute(attrName: AttributeNames): AttributeInfo {
    const attr = this._programInfo.attributes[attrName]
    if (!attr) {
      throw new Error(`Attribute '${attrName.toString()}' does not exist`)
    }
    return attr
  }

  protected createBuffer(target = this.gl.ARRAY_BUFFER): WebGLBuffer {
    const buffer = this.gl.createBuffer()
    if (!buffer) {
      throw new Error("Failed to create buffer")
    }
    this.gl.bindBuffer(target, buffer)
    return buffer
  }

  private static _getUniformLocationOrThrow(
    name: string,
    gl: WebGLRenderingContext,
    program: WebGLProgram,
  ): WebGLUniformLocation {
    const uniformLocation = gl.getUniformLocation(program, name)
    if (!uniformLocation) {
      throw new Error(`Failed to get uniform location. Does the specified program have a '${name}' uniform?`)
    }
    return uniformLocation
  }

  protected bufferAttribute(
    attrName: AttributeNames,
    data: Readonly<Float32Array>,
    {
      usage,
      size,
      type = WebGLRenderingContext.FLOAT,
      isNormalized = false,
      stride = 0,
      offset = 0,
    }: {
      usage: number
      size: number
      type?: number
      isNormalized?: boolean
      stride?: number
      offset?: number
      context?: ExtendableProgramInfo
    },
  ): void {
    const attr = this.getAttribute(attrName)
    if (!attr.buffer) {
      attr.buffer = this.createBuffer(WebGLRenderingContext.ARRAY_BUFFER)
    } else {
      this.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, attr.buffer)
    }
    this.gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, data, usage)
    this.gl.enableVertexAttribArray(attr.location)
    this.gl.vertexAttribPointer(attr.location, size, type, isNormalized, stride, offset)
  }
}
