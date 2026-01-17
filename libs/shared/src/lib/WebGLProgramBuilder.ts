type SourceCacheEntry<T extends string> = { source: Readonly<Record<T, string>>; cached: Record<T, string> }
export class WebGLProgramBuilder {
  protected vertexShader: WebGLShader
  protected fragmentShader: WebGLShader
  private static sourceMapCache: SourceCacheEntry<any>[] = []

  protected constructor(
    protected readonly gl: WebGLRenderingContext,
    vertexShaderSource: string,
    fragmentShaderSource: string,
  ) {
    this.gl = gl
    this.vertexShader = this.createShader(vertexShaderSource, gl.VERTEX_SHADER)
    this.fragmentShader = this.createShader(fragmentShaderSource, gl.FRAGMENT_SHADER)
  }

  /**
   * Recursively builds a GLSL source string from a source map.
   * The source code may contain `#require "filename";` statements to include other files.
   * The source map is modified in-place to contain the full source code for each file.
   *
   * @param mutableSourceMap The source map to use. This will be modified in-place.
   * @param sourceFile The file within the source map to build the source for.
   * @returns The fully resolved GLSL source code for the given file.
   */
  public static buildGlslSource<K extends string>(mutableSourceMap: Record<K, string>, sourceFile: K): string {
    if (!(sourceFile in mutableSourceMap)) {
      throw new Error(`Failed to resolve source file '${sourceFile}'`)
    }
    const rawSource: string = mutableSourceMap[sourceFile]

    const resolvedSource = rawSource.replace(
      /((?:^|[;{}])[\r\n\s]*)#require\s+"(.*)";/g,
      (_, beforeRequire, requiredFile) => {
        if (requiredFile === sourceFile) {
          throw new Error(`Circular dependency detected for file '${sourceFile.toString()}'`)
        }

        const requiredSource = WebGLProgramBuilder.buildGlslSource(mutableSourceMap, requiredFile)
        return `${beforeRequire}${requiredSource}`
      },
    )

    mutableSourceMap[sourceFile] = resolvedSource

    return resolvedSource
  }

  public static createFromSourceMap<T extends string>(
    gl: WebGLRenderingContext,
    sourceMap: Readonly<Record<T, string>>,
    vertexShaderSource: T,
    fragmentShaderSource: T,
  ): WebGLProgram {
    const mutableSource = WebGLProgramBuilder.getCachedSources(sourceMap)

    const builder = new WebGLProgramBuilder(
      gl,
      WebGLProgramBuilder.buildGlslSource(mutableSource, vertexShaderSource),
      WebGLProgramBuilder.buildGlslSource(mutableSource, fragmentShaderSource),
    )
    return builder.createProgram()
  }

  private static getCachedSources<T extends string>(sourceMap: Readonly<Record<T, string>>): Record<T, string> {
    const mutableSourceMap = WebGLProgramBuilder.sourceMapCache.find((map) => map.source === sourceMap)
    if (mutableSourceMap) {
      return mutableSourceMap.cached
    }
    const newMutableSourceMap = { source: sourceMap, cached: { ...sourceMap } }
    WebGLProgramBuilder.sourceMapCache.push(newMutableSourceMap)
    return newMutableSourceMap.cached
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
    this.gl.useProgram(program)
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
