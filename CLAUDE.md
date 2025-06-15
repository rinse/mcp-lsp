# CLAUDE.md

## Project Overview

MCP server that bridges TypeScript Language Server Protocol (LSP) capabilities to MCP tools, enabling Claude Code to interact with TypeScript projects through LSP features.

## Predefined Tasks

`*<PREDEFINED_TASK>` → Execute `.claude/predefined-tasks/<PREDEFINED_TASK>.md`

## Architecture

- **LSPManager**: Central coordinator for LSP operations
- **LSPServerStream**: Manages stdio communication with TypeScript language server
- **Tools**: `src/tools/` - MCP tool implementations (hover, definition, rename, codeAction, executeCodeAction)
- **Transport**: stdio using `@modelcontextprotocol/sdk`

## Commands and Tools

### Build & Test Commands
- `npm test` - Run all tests
- `npm run lint:fix` - Fix code style issues
- `npm run build` - Compile TypeScript

### MCP-LSP Tools (USE THESE INSTEAD OF MANUAL EDITING)

**Position finding:** `awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'`

#### mcp__mcp-lsp__rename
**REQUIRED** for renaming symbols. Updates all references across project.
- Parameters: `uri`, `line`, `character`, `newName`

#### mcp__mcp-lsp__definition  
**REQUIRED** for finding symbol definitions. More accurate than grep.
- Parameters: `uri`, `line`, `character`

#### mcp__mcp-lsp__hover
**REQUIRED** for understanding types and documentation.
- Parameters: `uri`, `line`, `character`

#### mcp__mcp-lsp__implementation
Find where interfaces/abstract classes are implemented.
- Parameters: `uri`, `line`, `character`

#### mcp__mcp-lsp__references
Find all references to a symbol.
- Parameters: `uri`, `line`, `character`, `includeDeclaration` (optional)

#### mcp__mcp-lsp__typeDefinition
Jump to type definition of a symbol.
- Parameters: `uri`, `line`, `character`

#### mcp__mcp-lsp__codeAction
Get available code actions (quick fixes, refactorings).
- Parameters: `uri`, `line`, `character`, `endLine`, `endCharacter`

#### mcp__mcp-lsp__executeCodeAction
Apply code actions from codeAction tool.
- Parameters: `codeAction` object from codeAction results