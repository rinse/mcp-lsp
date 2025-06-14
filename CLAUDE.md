# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools. The server enables Claude Code to interact with TypeScript projects through LSP features like hover information and symbol renaming.

## IMPORTANT: Preferred Workflow

**ALWAYS use the MCP-LSP tools instead of manual editing when possible.** This is significantly more efficient and saves tokens while ensuring accuracy.

### Primary Tools to Use (in order of preference):

1. **`mcp__mcp-lsp__rename`** - For renaming symbols across the entire project
   - **USE THIS instead of Edit tool for renaming variables, functions, classes, etc.**
   - Automatically updates all references across all files
   - Ensures type safety and prevents broken references
   - Much more efficient than manual find-and-replace operations

2. **`mcp__mcp-lsp__definition`** - For finding where symbols are defined
   - **USE THIS instead of Grep/Read when looking for symbol definitions**
   - Instantly locates the exact definition of any symbol
   - More accurate than text-based searching

3. **`mcp__mcp-lsp__hover`** - For understanding symbol types and documentation
   - **USE THIS instead of reading multiple files to understand types**
   - Provides complete type information and JSDoc comments
   - Shows function signatures and return types

### Workflow Guidelines:

1. **Before making changes**: Use `definition` and `hover` tools to understand the code
2. **For renaming**: ALWAYS use `rename` tool instead of manual editing
3. **After using MCP-LSP tools**: Always run verification:
   ```bash
   npm test        # Verify functionality
   npm run lint    # Check code style
   npm run build   # Ensure compilation
   ```

**Why this approach is better:**
- **Token efficiency**: LSP tools provide precise information without reading entire files
- **Accuracy**: TypeScript-aware operations prevent errors
- **Speed**: Direct symbol operations vs manual text manipulation
- **Safety**: Automatic reference updating across the entire project

## Commands

### Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Compile TypeScript in watch mode
- `npm test` - Run all tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

### Code Quality

After editing code, always run:
- `npm run build` - Ensure code compiles without errors
- `npm test` - Verify all tests pass
- `npm run lint` - Check code style compliance

### Testing the MCP Server

The MCP server is already configured and accessible. To test changes:

```bash
npm run build
```

After rebuilding, the server at `out/index.js` will reflect your changes and can be tested directly.

### Running TypeScript Language Server

TypeScript Language Server starts with the following command.

```bash
npm run typescript-language-server
```

It communicates with stdio in [LSP](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/).

## How to communicate with language servers

First, you send an `initialize` request.

```
Content-Length: 76\r\n
\r\n
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"capabilities": {}}}
```

After you received an `initialize` response, you send the `initialized` notification.

```
Content-Length: 59\r\n
\r\n
{"jsonrpc":"2.1","id":1,"method":"initialized","params":{}}
```

Because it is a notification, the server won't respond to it.
Now you can send any requests as you want.

## Architecture

This MCP server bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools. The server:

- **Transport**: Runs on stdio using `@modelcontextprotocol/sdk`
- **LSP Integration**: Spawns and communicates with TypeScript Language Server via stdio
- **Tool Registry**: Exposes LSP capabilities as MCP tools (hover, definition, rename)
- **Message Parsing**: Handles LSP's Content-Length HTTP-style message format
- **Document Lifecycle**: Manages opening/closing documents for LSP operations

### Key Components

- **LSPManager**: Central coordinator for LSP operations
- **LSPServerStream**: Manages stdio communication with TypeScript language server
- **LSPMessageParser**: Parses LSP's Content-Length message format
- **MCPTool**: Base interface for MCP tools that wrap LSP capabilities
- **StreamEventEmitter**: Event-driven communication layer

### Code Organization

- `src/index.ts` - MCP server entry point
- `src/lsp/` - LSP client implementation and type definitions
- `src/tools/` - MCP tool implementations (hover, definition, rename)
- `src/utils/` - Logging and utility functions
- `out/` - Compiled JavaScript output

## Coding Standards

### Type Safety Requirements

- **NEVER use `as any`**: Type safety is our most reliable friend. Always use proper TypeScript types and avoid type assertions that bypass the type system.
- When encountering type conflicts, investigate and fix the root cause rather than using type assertions
- Prefer creating proper type-safe interfaces and using type guards over forcing type compatibility
- If external libraries have poor types, create proper type definitions rather than using `any`

### Code Formatting

- **No empty lines within function bodies**: Function bodies should be compact without empty lines
- **Single empty line between function definitions**: Always insert exactly one empty line between function declarations

## Available Tools

### hover
Get hover information for a position in a TypeScript file.

**Finding precise positions:** Use `grep -n` or `rg -n` to get exact line numbers for hovering over specific symbols.

**Parameters:**
- `uri` (string): File URI (e.g., file:///path/to/file.ts)
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)

### definition
Get definition location for a symbol at a specific position in a TypeScript file.

**Finding precise positions:** Use `grep -n` or `rg -n` to get exact line numbers for finding definitions of specific symbols.

**Parameters:**
- `uri` (string): File URI (e.g., file:///path/to/file.ts)
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)

**Returns:** The location(s) where the symbol is defined, including file path and line/character positions.

### rename
Rename a symbol at a specific position in a TypeScript file.

**IMPORTANT:** When working on code improvements or refactoring, you should actively use the rename tool to rename symbols for better code clarity and consistency. This is preferred over manual find-and-replace operations as it ensures all references are updated correctly across the entire project.

**When to use rename:**
- Improving variable, function, or class names for better readability
- Standardizing naming conventions across the codebase
- Refactoring code to use more descriptive names
- Any time you want to change a symbol name throughout the project

**Parameters:**
- `uri` (string): File URI (e.g., file:///path/to/file.ts)
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)
- `newName` (string): The new name for the symbol

**Returns:** Successfully applies the rename across all files and reports the changes made.

## Documentation Resources

The `docs/` directory contains reference links for:
- **LSP (Language Server Protocol)**: Specification and implementation guides
- **MCP (Model Context Protocol)**: Introduction and concept documentation

When implementing LSP or MCP features, refer to links in these documentation files for the appropriate specifications.
