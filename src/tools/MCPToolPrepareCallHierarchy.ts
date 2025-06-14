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
import { CallHierarchyItem } from "../lsp/types/CallHierarchyRequest";

export class MCPToolPrepareCallHierarchy implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemPrepareCallHierarchy();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handlePrepareCallHierarchy(this.manager, params);
  }
}

function listItemPrepareCallHierarchy(): Tool {
  return {
    name: 'prepareCallHierarchy',
    description: 'Prepare call hierarchy information for a symbol at a specific position',
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
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const PrepareCallHierarchyParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handlePrepareCallHierarchy(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = PrepareCallHierarchyParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for prepareCallHierarchy tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    const result = await manager.prepareCallHierarchy({
      textDocument: { uri },
      position: { line, character },
    });
    return result !== null
      ? prepareCallHierarchyToCallToolResult(result)
      : prepareCallHierarchyNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to prepare call hierarchy: ${String(error)}`);
  }
}

function prepareCallHierarchyToCallToolResult(items: CallHierarchyItem[]): CallToolResult {
  return {
    content: prepareCallHierarchyToTextContents(items),
  };
}

function prepareCallHierarchyToTextContents(items: CallHierarchyItem[]): TextContent[] {
  if (items.length === 0) {
    return [{
      type: 'text',
      text: 'No call hierarchy items found.',
    }];
  }
  return [{
    type: 'text',
    text: JSON.stringify(items, null, 2),
  }];
}

function prepareCallHierarchyNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No call hierarchy available at this position.',
    }],
  };
}
