# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `pnpm dev` - Start the development server for the web application
- `pnpm build` - Build the web application (runs TypeScript compiler and Vite build)
- `pnpm lint` - Check code formatting with Prettier
- `pnpm lint:fix` - Automatically fix formatting issues
- `pnpm type-check` - Run TypeScript type checking across all packages
- `pnpm test` - Run tests with Vitest

### Package Management

This is a monorepo using pnpm workspaces. To install dependencies:

- Root workspace: `pnpm -w install [package-name] --save-dev`
- Specific package: `pnpm --filter [package-name] install [dependency-name]`

### Running a Single Test

```sh
pnpm test [test-file-path]
```

## Architecture Overview

This is a WebGL-based drawing application structured as a monorepo with the following key components:

### Package Structure

- **apps/web** - Main web application using Vite
  - Entry point: `src/main.ts`
  - Custom components in `src/components/`
  - UI helpers in `src/helpers/`
- **libs/drawing-engine** - Core drawing engine with WebGL implementation
  - `DrawingEngine` class manages drawing state and layers
  - `WebDrawingEngine` extends it for web-specific features
  - Tools system: `LineTool` (brush/eraser), `EyeDropperTool`
  - WebGL programs for rendering lines and textures
- **libs/color-picker** - Custom WebGL-based color picker
  - Uses GPU shaders for gradient rendering
  - Hue/saturation/value color model
- **libs/shared** - Shared utilities
  - `Color` class for color manipulation
  - WebGL program builders and base classes
  - Common types and utilities
- **libs/jsx-factory** - Custom JSX implementation for lightweight DOM manipulation

### Key Architectural Patterns

- **Layer System**: Drawing engine uses separate layers for saved drawings and active drawings
- **Tool Architecture**: Tools implement common interfaces for handling input events
- **WebGL Programs**: Shader-based rendering with custom GLSL shaders in each lib
- **Event System**: Drawing engine emits events for tool changes, drawing actions, etc.
- **State Management**: Drawing state (color, opacity, tool) managed centrally in DrawingEngine

### WebGL Implementation

- Custom shader programs in `*/shaders/` directories
- Shader source maps generated for debugging
- Programs extend from base classes in `@libs/shared`

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
NEVER use type assertions like `as any` that circumvent type safety.
Avoid overusing the word "comprehensive" in descriptions and commit messages.
