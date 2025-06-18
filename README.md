# MCP-LSP

A general MCP server for LSP (Language Server Protocol).

## Development and Testing

### MCP Inspector

The MCP Inspector provides an interactive web UI for testing and debugging the MCP LSP server, enabling Claude to test and develop MCP server implementations efficiently without requiring Claude restarts.

```bash
# Build the project first
npm run build

# Launch Web UI for interactive testing
npm run inspector
# Then navigate to http://localhost:6274

# Or use CLI mode for individual tool testing
npm run inspector-tool -- --tool-name <tool> --tool-arg <arg>=<value>
```

#### Usage Examples

**Test hover tool:**
```bash
npm run inspector-tool -- --tool-name hover --tool-arg uri=file:///path/to/file.ts --tool-arg line=10 --tool-arg character=5
```

**Test definition tool:**
```bash
npm run inspector-tool -- --tool-name definition --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10
```

**Test rename tool:**
```bash
npm run inspector-tool -- --tool-name rename --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg newName=newVariableName
```

**Test codeAction tool:**
```bash
npm run inspector-tool -- --tool-name codeAction --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg endLine=5 --tool-arg endCharacter=20
```
