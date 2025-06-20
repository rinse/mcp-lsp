# CLAUDE.md

## Project Overview

MCP server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools, enabling Claude Code to interact with TypeScript projects through LSP features.

## Claude Commands

Claude commands are available in `.claude/commands/` directory for automated workflows.

## Architecture

- **LSPManager**: Central coordinator for LSP operations
- **LSPServerStream**: Manages stdio communication with TypeScript language server
- **Tools**: `src/tools/` - MCP tool implementations (get_hover_info, get_definition_locations, find_implementation_locations, get_symbol_references, rename, codeAction, executeCodeAction)
- **Transport**: stdio using `@modelcontextprotocol/sdk`

## Commands and Tools

### Build & Test Commands
- `npm test` - Run all tests
- `npm run lint:fix` - Fix code style issues
- `npm run build` - Compile TypeScript

### Testing with MCP Inspector
Use MCP Inspector to test newly developed MCP tools.

#### Command Examples
Basic syntax:
```bash
npm run inspector-tool -- --tool-name <TOOL_NAME> [--tool-arg <KEY>=<VALUE>]...
```

Examples:
**Test get_hover_info tool (get type info and documentation):**
```bash
npm run inspector-tool -- --tool-name get_hover_info --tool-arg uri=file:///path/to/file.ts --tool-arg line=10 --tool-arg character=5
```

**Test get_definition_locations tool (jump to symbol definition):**
```bash
npm run inspector-tool -- --tool-name get_definition_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10
```

**Test find_implementation_locations tool (find interface/abstract class implementations):**
```bash
npm run inspector-tool -- --tool-name find_implementation_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=15 --tool-arg character=8
```

**Test get_symbol_references tool (find all symbol references):**
```bash
# Include declaration
npm run inspector-tool -- --tool-name get_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=true

# Exclude declaration
npm run inspector-tool -- --tool-name get_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=false
```

**Test typeDefinition tool (jump to type definition):**
```bash
npm run inspector-tool -- --tool-name typeDefinition --tool-arg uri=file:///path/to/file.ts --tool-arg line=20 --tool-arg character=15
```

**Test rename tool (rename symbol across project):**
```bash
npm run inspector-tool -- --tool-name rename --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg newName=newVariableName
```

**Test codeAction tool (get available quick fixes/refactorings):**
```bash
npm run inspector-tool -- --tool-name codeAction --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg endLine=5 --tool-arg endCharacter=20
```

**Test executeCodeAction tool (apply a code action):**
```bash
# First get code actions, then use the returned action object
npm run inspector-tool -- --tool-name executeCodeAction --tool-arg 'codeAction={"title":"Add missing import","kind":"quickfix","edit":{"changes":{...}}}'
```

**Test callHierarchy tool (find incoming calls to a function):**
```bash
npm run inspector-tool -- --tool-name callHierarchy --tool-arg uri=file:///path/to/file.ts --tool-arg line=25 --tool-arg character=5
```

**Test callees tool (find outgoing calls from a function):**
```bash
npm run inspector-tool -- --tool-name callees --tool-arg uri=file:///path/to/file.ts --tool-arg line=30 --tool-arg character=10
```

**Position finding:** `awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'`
