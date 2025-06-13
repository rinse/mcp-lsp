# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests

### Code Quality

After editing code, always run:
- `npm run build` - Ensure code compiles without errors
- `npm test` - Verify all tests pass

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

This is a Model Context Protocol (MCP) server implementation that bridges LSP (Language Server Protocol) capabilities to MCP tools. The server:

- Runs on stdio transport (standard input/output)
- Uses the `@modelcontextprotocol/sdk` for MCP protocol implementation
- Spawns and communicates with TypeScript Language Server via stdio
- Bridges LSP capabilities as MCP tools

Key architectural patterns:
- **Interface-based design**: Clear separation between interfaces (`LSPServer`, `LSPRequester`, `LSPTool`) and implementations
- **Tool Registry**: Uses a Map to register LSP tools that can be exposed via MCP
- **Message-based communication**: Both MCP and LSP use JSON-RPC 2.0 over stdio
- Request handlers are registered for `tools/list` and `tools/call` methods
- All logging goes to stderr to avoid interfering with stdio communication
- Document lifecycle management (open/close tracking)

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
