# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools. The server enables Claude Code to interact with TypeScript projects through LSP features like hover information and symbol renaming.

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
- **Tool Registry**: Exposes LSP capabilities as MCP tools (hover, rename)
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
- `src/tools/` - MCP tool implementations (hover, rename)
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

### rename
Rename a symbol at a specific position in a TypeScript file.

**Parameters:**
- `uri` (string): File URI (e.g., file:///path/to/file.ts)  
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)
- `newName` (string): The new name for the symbol

**Returns:** A formatted list of file changes showing what would be renamed across the project.

## Documentation Resources

The `docs/` directory contains reference links for:
- **LSP (Language Server Protocol)**: Specification and implementation guides
- **MCP (Model Context Protocol)**: Introduction and concept documentation

When implementing LSP or MCP features, refer to links in these documentation files for the appropriate specifications.
