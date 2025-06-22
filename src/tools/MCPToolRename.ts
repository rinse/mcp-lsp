import {
  ErrorCode,
  McpError,
  type CallToolRequest,
  type CallToolResult,
  type TextContent,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as t from "io-ts";

import { MCPTool } from "./MCPTool";
import { LSPManager } from "../lsp/LSPManager";
import { WorkspaceEdit } from "../lsp/types/WorkspaceEdit";

export class MCPToolRename implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemRename();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleRename(this.manager, params);
  }
}

function listItemRename(): Tool {
  return {
    name: 'refactor_rename_symbol',
    description: `**Always rename the target symbol everywhere it appears—across every file, import, and reference—using a single, atomic operation.**

**You MUST call this tool whenever** the user or agent asks "Rename this variable/function/class", "Change identifier name", "Refactor → rename", "Update name across files", or any similar request.

Why use it? Skip manual search-and-replace—this refactor is language-aware, prevents missed edits, and saves tokens by avoiding the need to load every file into context.

Typical trigger phrases (non-exhaustive):
  • "rename symbol <newName>" / "change name to <newName>"
  • "refactor rename" / "update identifier project-wide"
  • "shift to snake_case / camelCase"

Output
Plain text confirmation of the rename operation:
  Success: Successfully renamed symbol to "<newName>"
  Failure: Failed to apply rename: <reason>

Notes & limits
* Only .ts / .tsx files currently supported
* The file must exist on disk (unsaved buffers not supported).
* Very large files (>2 MB) may increase latency.
* Position finding: \`awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'\``,
    inputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'Required. File URI (e.g., file:///path/to/file.ts)',
        },
        line: {
          type: 'number',
          description: 'Required. 0-based line index where the symbol is located.',
        },
        character: {
          type: 'number',
          description: 'Required. 0-based character index on that line.',
        },
        newName: {
          type: 'string',
          description: 'Required. The new identifier name.',
        },
      },
      required: ['uri', 'line', 'character', 'newName'],
    },
  };
}

const RenameParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
  newName: t.string,
});

async function handleRename(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = RenameParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for refactor_rename_symbol tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character, newName } = decoded.right;
  try {
    const workspaceEdit: WorkspaceEdit = await manager.rename({
      textDocument: { uri },
      position: { line, character },
      newName,
    }) ?? {};
    const applyResult = await manager.applyEdit({ edit: workspaceEdit });
    return {
      content: [
                {
                  type: 'text',
                  text: applyResult.applied
                    ? `Successfully renamed symbol to "${newName}"`
                    : `Failed to apply rename: ${applyResult.failureReason ?? 'Unknown error'}`,
                } satisfies TextContent,
      ],
    };
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to rename symbol: ${String(error)}`);
  }
}
