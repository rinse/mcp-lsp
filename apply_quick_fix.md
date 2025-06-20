# Tool Rename Proposal: `codeAction` → `get_code_actions`

## Overview

| Key | Value |
|-----|-------|
| **Current name** | `codeAction` |
| **Proposed name** | `get_code_actions` |
| **Full MCP name** | `mcp__typescript-code-assistant__get_code_actions` |
| **Purpose** | Get all available code actions (quick fixes, refactorings, source actions) for a specific range in a TypeScript file |

## Description

**Always fetch available code actions—especially missing-import fixes—for any range in a TypeScript file before applying manual edits.**

🔍 **You MUST call this tool whenever** the user or agent encounters TypeScript errors like "Cannot find name '…'", TS2304, TS2552, or any unresolved-symbol error. It returns every available quick fix (import insertion, spelling correction, refactor, source action) for the supplied range.

**Why use it?** Skip manual search-and-replace—this tool provides language-aware quick fixes that prevent missed imports and ensure proper TypeScript compilation.

## Typical Trigger Phrases

- "Fix the missing symbol/import" / "Add the correct import"
- "Apply quick fix" / "Get available fixes" / "Show code actions"
- "Organize imports" / "Resolve this error"
- Any diagnostic that points to an unknown identifier or suggests a quick fix

## When to Call

- **Mandatory usage rule:** If compilation fails because a reference is unknown, invoke `get_code_actions` before attempting manual edits
- When TypeScript raises compilation errors for unresolved symbols
- When you need to see all available refactoring options for a code range
- When organizing imports or applying source actions

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uri` | string | ✓ | File URI (e.g., `file:///path/to/file.ts`) |
| `line` | number | ✓ | Start line number (0-based) |
| `character` | number | ✓ | Start character position (0-based) |
| `endLine` | number | ✓ | End line number (0-based) |
| `endCharacter` | number | ✓ | End character position (0-based) |
| `diagnostics` | array | | Array of diagnostic objects to filter code actions |
| `only` | array | | Array of CodeActionKind strings to filter by action type (e.g., `["quickfix"]`) |

## Output Example

```
Found 3 code action(s):

1. Add import from "./utils" (quickfix) [PREFERRED]
   📋 For run_code_action tool:
{
  "title": "Add import from \"./utils\"",
  "kind": "quickfix",
  "isPreferred": true,
  "edit": {
    "changes": {
      "file:///path/to/file.ts": [
        {
          "range": {
            "start": { "line": 0, "character": 0 },
            "end": { "line": 0, "character": 0 }
          },
          "newText": "import { validateInput } from \"./utils\";\n"
        }
      ]
    }
  }
}
   📝 Addresses diagnostics:
   - Error: Cannot find name 'validateInput' (typescript)
   📄 File changes:
   - file:///path/to/file.ts: 1 edit(s)

2. Extract to constant (refactor)
   📋 For run_code_action tool:
{
  "title": "Extract to constant",
  "kind": "refactor",
  "edit": {
    "changes": {
      "file:///path/to/file.ts": [
        {
          "range": {
            "start": { "line": 5, "character": 12 },
            "end": { "line": 5, "character": 25 }
          },
          "newText": "MAGIC_NUMBER"
        }
      ]
    }
  }
}
   📄 File changes:
   - file:///path/to/file.ts: 1 edit(s)

3. Organize imports (source)
   📋 For run_code_action tool:
{
  "title": "Organize imports",
  "kind": "source",
  "command": {
    "title": "Organize imports",
    "command": "typescript.organizeImports"
  }
}
   ⚡ Command: Organize imports (typescript.organizeImports)
```

**When no actions are available:**
```
No code actions available.
```

## Usage Notes & Limitations

- Only `.ts` / `.tsx` files currently supported
- The file must exist on disk (unsaved buffers not supported)
- Very large files (>2 MB) may increase latency
- Use with `run_code_action` tool to apply the returned actions
- **Position finding**: `awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'`

## Workflow

1. Call `get_code_actions` to get available fixes for a range
2. Review the returned actions and select the appropriate one
3. Use `run_code_action` tool to apply the selected action

## Rationale for Rename

The name `get_code_actions` is more descriptive and consistent with the naming pattern used by other tools in this project:

- `get_hover_info` - Gets hover information
- `get_definition_locations` - Gets definition locations
- `get_symbol_references` - Gets symbol references
- `find_caller_locations` - Finds caller locations
- `find_callee_locations` - Finds callee locations
- `refactor_rename_symbol` - Refactors/renames symbols

The new name clearly indicates that this tool **retrieves** code actions, making it more intuitive for users.