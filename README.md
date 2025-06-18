# MCP-LSP

A general MCP server for LSP (Language Server Protocol).

## Development with Claude

### MCP Inspector

The MCP Inspector provides CLI accessing to MCP servers, enabling Claude to test and develop MCP server implementations efficiently without requiring Claude restarts.

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
