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
import { CallHierarchyIncomingCall } from "../lsp/types/CallHierarchyRequest";

export class MCPToolIncomingCalls implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemIncomingCalls();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleIncomingCalls(this.manager, params);
  }
}

function listItemIncomingCalls(): Tool {
  return {
    name: 'incomingCalls',
    description: 'Find all locations that call a specific function/method',
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

const IncomingCallsParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleIncomingCalls(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = IncomingCallsParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for incomingCalls tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    // First prepare call hierarchy
    const prepareResult = await manager.prepareCallHierarchy({
      textDocument: { uri },
      position: { line, character },
    });
    if (prepareResult === null || prepareResult.length === 0) {
      return incomingCallsNothingContent();
    }
    // Use the first item to get incoming calls
    const result = await manager.incomingCalls({ item: prepareResult[0] });
    return result !== null
      ? incomingCallsToCallToolResult(result)
      : incomingCallsNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get incoming calls: ${String(error)}`);
  }
}

function incomingCallsToCallToolResult(calls: CallHierarchyIncomingCall[]): CallToolResult {
  return {
    content: incomingCallsToTextContents(calls),
  };
}

function incomingCallsToTextContents(calls: CallHierarchyIncomingCall[]): TextContent[] {
  if (calls.length === 0) {
    return [{
      type: 'text',
      text: 'No incoming calls found.',
    }];
  }
  return [{
    type: 'text',
    text: JSON.stringify(calls, null, 2),
  }];
}

function incomingCallsNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No incoming calls available for this item.',
    }],
  };
}
