export interface BaseProgramContext<UniformNames extends string, AttributeNames extends string> {
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
  useContext(context: WebGLRenderingContext): this
  gl: WebGLRenderingContext
  useProgram(): this
  syncCanvasSize(): this
  getCanvasSize(): { width: number; height: number }
  checkError(): this
}

export abstract class BaseProgram<
  UniformNames extends string,
  AttributeNames extends string,
  ExtendableContext extends BaseProgramContext<UniformNames, AttributeNames> = BaseProgramContext<
    UniformNames,
    AttributeNames
  >,
> implements IBaseProgram
{
  private contexts: ExtendableContext[] = []

  constructor(private _currentContext: ExtendableContext) {
    this.currentContext = _currentContext
  }

  public useContext(context: WebGLRenderingContext): this {
    this.currentContext = this.findOrCreateContext(context)
    return this
  }

  protected abstract createContext(context: WebGLRenderingContext, program: WebGLProgram): ExtendableContext

  protected static makeBaseContextFromAttributes<UniformNames extends string, AttributeNames extends string>(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    uniformNames: Record<UniformNames, string>,
    attributeNames: Record<AttributeNames, string>,
  ): BaseProgramContext<UniformNames, AttributeNames> {
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
    if (!this.currentContext) {
      throw new Error("No context is set")
    }
    return this.currentContext.gl
  }

  public set gl(gl: WebGLRenderingContext) {
    this.useContext(gl)
  }

  public useProgram(context = this.currentContext): this {
    context.gl.useProgram(context.program)
    this.syncCanvasSize(context)
    return this
  }

  public syncCanvasSize(context = this.currentContext): typeof this {
    const { width, height } = this.getCanvasSize()
    context.gl.viewport(0, 0, width, height)
    return this
  }

  // todo: refactor out the canvas size logic from the program and base program so that it doesn't rely on HTMLElements
  public getCanvasSize(context = this.currentContext): { width: number; height: number } {
    const canvas = context.gl.canvas
    if (!(canvas instanceof HTMLElement)) {
      throw new Error("Could not get canvas size, canvas is not an HTMLCanvasElement")
    }
    const boundingRect = canvas.getBoundingClientRect()

    return { width: boundingRect.width, height: boundingRect.height }
  }

  public checkError(context = this.currentContext): typeof this {
    const error = context.gl.getError()
    if (error !== WebGLRenderingContext.NO_ERROR) {
      throw new Error("WebGL error: " + error)
    }
    return this
  }

  protected get currentContext(): ExtendableContext {
    if (!this._currentContext) {
      throw new Error("No context is set")
    }
    return this._currentContext
  }

  private set currentContext(context: ExtendableContext) {
    this._currentContext = context
    context.gl.useProgram(context.program)
  }

  protected get program(): WebGLProgram {
    if (!this.currentContext) {
      throw new Error("No context is set")
    }
    return this.currentContext.program
  }

  private findContext(context: WebGLRenderingContext) {
    return this.contexts.find(({ gl: ctx }) => ctx === context)
  }

  private findOrCreateContext(context: WebGLRenderingContext) {
    const existingContext = this.findContext(context)
    if (existingContext) {
      return existingContext
    }
    const program = this.createProgram(context)
    const newContext = this.createContext(context, program)
    this.contexts.push(newContext)
    return newContext
  }

  protected abstract createProgram(context: WebGLRenderingContext): WebGLProgram

  protected getUniformLocation(name: UniformNames, context = this.currentContext): WebGLUniformLocation {
    return context.uniforms[name]
  }

  protected getAttribute(attrName: AttributeNames, context = this.currentContext): AttributeInfo {
    const attr = context.attributes[attrName]
    if (!attr) {
      throw new Error(`Attribute '${attrName.toString()}' does not exist`)
    }
    return attr
  }

  protected createBuffer(target = this.gl.ARRAY_BUFFER, context = this.currentContext): WebGLBuffer {
    const buffer = context.gl.createBuffer()
    if (!buffer) {
      throw new Error("Failed to create buffer")
    }
    context.gl.bindBuffer(target, buffer)
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
      context = this.currentContext,
    }: {
      usage: number
      size: number
      type?: number
      isNormalized?: boolean
      stride?: number
      offset?: number
      context?: ExtendableContext
    },
  ): void {
    const attr = this.getAttribute(attrName, context)
    if (!attr.buffer) {
      attr.buffer = this.createBuffer(WebGLRenderingContext.ARRAY_BUFFER, context)
    } else {
      context.gl.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, attr.buffer)
    }
    context.gl.bufferData(WebGLRenderingContext.ARRAY_BUFFER, data, usage)
    context.gl.enableVertexAttribArray(attr.location)
    context.gl.vertexAttribPointer(attr.location, size, type, isNormalized, stride, offset)
  }
}
