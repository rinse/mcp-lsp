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
    name: 'rename',
    description: 'Rename a symbol at a specific position in a TypeScript file',
    inputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'File URI (e.g., file:///path/to/file.ts)',
        },
        line: {
          type: 'number',
          description: 'Line number (0-based)',
        },
        character: {
          type: 'number',
          description: 'Character position (0-based)',
        },
        newName: {
          type: 'string',
          description: 'The new name for the symbol',
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for rename tool: ${JSON.stringify(decoded.left)}`);
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
