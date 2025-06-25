# CLAUDE.md

## Project Overview

MCP server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools, enabling Claude Code to interact with TypeScript projects through LSP features.

## Architecture

- **LSPManager**: Central coordinator for LSP operations
- **LSPServerStream**: Manages stdio communication with TypeScript language server
- **Tools**: `src/tools/` - MCP tool implementations (get_hover_info, list_definition_locations, list_implementation_locations, list_symbol_references, get_type_declaration, refactor_rename_symbol, list_available_code_actions, run_code_action, list_caller_locations_of, list_callee_locations_in)
- **Transport**: stdio using `@modelcontextprotocol/sdk`

## Specification
Think about reading the LSP specification: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/
Think about reading the MCP specification: https://modelcontextprotocol.io/specification/2025-03-26

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

**Test list_definition_locations tool (jump to symbol definition):**
```bash
npm run inspector-tool -- --tool-name list_definition_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10
```

**Test list_implementation_locations tool (find interface/abstract class implementations):**
```bash
npm run inspector-tool -- --tool-name list_implementation_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=15 --tool-arg character=8
```

**Test list_symbol_references tool (find all symbol references):**
```bash
# Include declaration
npm run inspector-tool -- --tool-name list_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=true

# Exclude declaration
npm run inspector-tool -- --tool-name list_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=false
```

**Test get_type_declaration tool (jump to type declaration):**
```bash
npm run inspector-tool -- --tool-name get_type_declaration --tool-arg uri=file:///path/to/file.ts --tool-arg line=20 --tool-arg character=15
```

**Test refactor_rename_symbol tool (rename symbol across project):**
```bash
npm run inspector-tool -- --tool-name refactor_rename_symbol --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg newName=newVariableName
```

**Test list_available_code_actions tool (get available quick fixes/refactorings):**
```bash
npm run inspector-tool -- --tool-name list_available_code_actions --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg endLine=5 --tool-arg endCharacter=20
```

**Test run_code_action tool (apply a code action):**
```bash
# First get code actions, then use the returned action object
npm run inspector-tool -- --tool-name run_code_action --tool-arg 'codeAction={"title":"Add missing import","kind":"quickfix","edit":{"changes":{...}}}'
```

**Test list_caller_locations_of tool (find incoming calls to a function):**
```bash
npm run inspector-tool -- --tool-name list_caller_locations_of --tool-arg uri=file:///path/to/file.ts --tool-arg line=25 --tool-arg character=5
```

**Test list_callee_locations_in tool (find outgoing calls from a function):**
```bash
npm run inspector-tool -- --tool-name list_callee_locations_in --tool-arg uri=file:///path/to/file.ts --tool-arg line=30 --tool-arg character=10
```

**Position finding:** `awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'`
