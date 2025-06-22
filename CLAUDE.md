# CLAUDE.md

## Project Overview

MCP server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools, enabling Claude Code to interact with TypeScript projects through LSP features.

## Claude Commands

Claude commands are available in `.claude/commands/` directory for automated workflows.

## Architecture

- **LSPManager**: Central coordinator for LSP operations
- **LSPServerStream**: Manages stdio communication with TypeScript language server
- **Tools**: `src/tools/` - MCP tool implementations (list_hover_info, list_definition_locations, find_implementation_locations, list_symbol_references, goto_type_declaration, refactor_rename_symbol, list_code_actions, run_code_action, find_caller_locations, find_callee_locations)
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
**Test list_hover_info tool (get type info and documentation):**
```bash
npm run inspector-tool -- --tool-name list_hover_info --tool-arg uri=file:///path/to/file.ts --tool-arg line=10 --tool-arg character=5
```

**Test list_definition_locations tool (jump to symbol definition):**
```bash
npm run inspector-tool -- --tool-name list_definition_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10
```

**Test find_implementation_locations tool (find interface/abstract class implementations):**
```bash
npm run inspector-tool -- --tool-name find_implementation_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=15 --tool-arg character=8
```

**Test list_symbol_references tool (find all symbol references):**
```bash
# Include declaration
npm run inspector-tool -- --tool-name list_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=true

# Exclude declaration
npm run inspector-tool -- --tool-name list_symbol_references --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg includeDeclaration=false
```

**Test goto_type_declaration tool (jump to type declaration):**
```bash
npm run inspector-tool -- --tool-name goto_type_declaration --tool-arg uri=file:///path/to/file.ts --tool-arg line=20 --tool-arg character=15
```

**Test refactor_rename_symbol tool (rename symbol across project):**
```bash
npm run inspector-tool -- --tool-name refactor_rename_symbol --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg newName=newVariableName
```

**Test list_code_actions tool (get available quick fixes/refactorings):**
```bash
npm run inspector-tool -- --tool-name list_code_actions --tool-arg uri=file:///path/to/file.ts --tool-arg line=5 --tool-arg character=10 --tool-arg endLine=5 --tool-arg endCharacter=20
```

**Test run_code_action tool (apply a code action):**
```bash
# First get code actions, then use the returned action object
npm run inspector-tool -- --tool-name run_code_action --tool-arg 'codeAction={"title":"Add missing import","kind":"quickfix","edit":{"changes":{...}}}'
```

**Test find_caller_locations tool (find incoming calls to a function):**
```bash
npm run inspector-tool -- --tool-name find_caller_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=25 --tool-arg character=5
```

**Test find_callee_locations tool (find outgoing calls from a function):**
```bash
npm run inspector-tool -- --tool-name find_callee_locations --tool-arg uri=file:///path/to/file.ts --tool-arg line=30 --tool-arg character=10
```

**Position finding:** `awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'`
