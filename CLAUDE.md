# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Testing the MCP Server

The MCP server is already configured and accessible. To test changes:

```bash
npm run build
```

After rebuilding, the server at `out/index.js` will reflect your changes and can be tested directly.

## Architecture

This is a Model Context Protocol (MCP) server implementation. The server:

- Runs on stdio transport (standard input/output)
- Uses the `@modelcontextprotocol/sdk` for MCP protocol implementation

Key architectural patterns:
- Request handlers are registered for `tools/list` and `tools/call` methods
- All logging goes to stderr to avoid interfering with stdio communication
- The server is designed to be a minimal template for building more complex MCP servers

## Documentation Resources

The `docs/` directory contains reference links for:
- **LSP (Language Server Protocol)**: Specification and implementation guides
- **MCP (Model Context Protocol)**: Introduction and concept documentation

When implementing LSP or MCP features, refer to these documentation files for the appropriate links and specifications.
