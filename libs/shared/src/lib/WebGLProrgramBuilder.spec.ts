import { WebGLProgramBuilder } from "./WebGLProgramBuilder"
import { describe, expect, it } from "vitest"

const exampleSourceMap = {
  requireAtStart: '#require "function";\nvoid main() {}\n',
  requireInFunction: 'void main() {\n  #require "comment";\n  // etc\n}',
  requireAtEnd: 'void main() {}\n#require "comment";\n',
  onlyRequire: '#require "function";',
  multipleRequires: '#require "function";\n#require "comment";\n',
  requiresMissing: '#require "missing";\n',
  chainedRequire: '//chained:\n#require "requireAtStart";\n',

  requireSelf: '#require "requireSelf";\n',

  parentCircularRequire: '#require "childCircularRequire";\n',
  childCircularRequire: '#require "parentCircularRequire";\n',

  function: "function foo() {}\n",
  comment: "// this is a comment\n",
} as const
const expectedResolvedSourceMap = {
  requireAtStart: "function foo() {}\n\nvoid main() {}\n",
  requireInFunction: "void main() {\n  // this is a comment\n\n  // etc\n}",
  multipleRequires: "function foo() {}\n// this is a comment\n\n",
  onlyRequire: "function foo() {}\n",
  requiresMissing: '#require "missing";\n',
  chainedRequire: `//chained:\nfunction foo() {}\n\nvoid main() {}\n`,
  requireAtEnd: "void main() {}\n// this is a comment\n\n",

  function: "function foo() {}\n",
  comment: "// this is a comment\n",
} as const

describe("WebGLProgramBuilder.buildGlslSource", () => {
  it("should resolve #require lines at the start of a sourceMap", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    const source = WebGLProgramBuilder.buildGlslSource(sourceMap, "requireAtStart")
    expect(source, "resolved source").toBe(expectedResolvedSourceMap.requireAtStart)
  })

  it("should update the sourceMap in-place", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    WebGLProgramBuilder.buildGlslSource(sourceMap, "requireAtStart")
    expect(sourceMap.requireAtStart).toBe(expectedResolvedSourceMap.requireAtStart)
  })

  it("should resolve #require lines in the middle of a sourceMap", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    const source = WebGLProgramBuilder.buildGlslSource(sourceMap, "requireInFunction")
    expect(source, "resolved source").toBe(expectedResolvedSourceMap.requireInFunction)
  })

  it("should resolve #require lines at the end of a sourceMap", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    const source = WebGLProgramBuilder.buildGlslSource(sourceMap, "requireAtEnd")
    expect(source, "resolved source").toBe(expectedResolvedSourceMap.requireAtEnd)
  })

  it("should resolve #require lines in a sourceMap with no other content", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    const source = WebGLProgramBuilder.buildGlslSource(sourceMap, "onlyRequire")
    expect(source, "resolved source").toBe(expectedResolvedSourceMap.onlyRequire)
  })

  // Chained requires are not currently supported
  it.todo("should handle chained #require statements", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    const source = WebGLProgramBuilder.buildGlslSource(sourceMap, "chainedRequire")
    expect(source, "resolved source").toBe(expectedResolvedSourceMap.chainedRequire)
  })

  it("should throw an error requested file is not in source map", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    // @ts-expect-error
    expect(() => WebGLProgramBuilder.buildGlslSource(sourceMap, "missing")).toThrow(
      "Failed to resolve source file 'missing'",
    )
  })

  it("should throw an error when a required file is not in the sourceMap", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    expect(() => WebGLProgramBuilder.buildGlslSource(sourceMap, "requiresMissing")).toThrow(
      "Failed to resolve source file 'missing'",
    )
  })

  it("should throw an error when a required file is the same as the requesting file", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    expect(() => WebGLProgramBuilder.buildGlslSource(sourceMap, "requireSelf")).toThrow(
      "Circular dependency detected for file 'requireSelf'",
    )
  })

  // currently this will throw a stack overflow error
  it.todo("should throw an error when a required file has a circular dependency", () => {
    const sourceMap = {
      ...exampleSourceMap,
    }
    expect(() => WebGLProgramBuilder.buildGlslSource(sourceMap, "parentCircularRequire")).toThrow(
      "Circular dependency detected for file 'parentCircularRequire'",
    )
  })
})
