# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests

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

When implementing LSP or MCP features, refer to links in these documentation files for the appropriate specifications.
