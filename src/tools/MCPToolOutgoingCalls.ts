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
import { CallHierarchyOutgoingCall } from "../lsp/types/CallHierarchyRequest";

export class MCPToolOutgoingCalls implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemOutgoingCalls();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleOutgoingCalls(this.manager, params);
  }
}

function listItemOutgoingCalls(): Tool {
  return {
    name: 'outgoingCalls',
    description: 'Find all functions/methods that a specific function calls',
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

const OutgoingCallsParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleOutgoingCalls(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = OutgoingCallsParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for outgoingCalls tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    // First prepare call hierarchy
    const prepareResult = await manager.prepareCallHierarchy({
      textDocument: { uri },
      position: { line, character },
    });
    if (prepareResult === null || prepareResult.length === 0) {
      return outgoingCallsNothingContent();
    }
    // Use the first item to get outgoing calls
    const result = await manager.outgoingCalls({ item: prepareResult[0] });
    return result !== null
      ? outgoingCallsToCallToolResult(result)
      : outgoingCallsNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get outgoing calls: ${String(error)}`);
  }
}

function outgoingCallsToCallToolResult(calls: CallHierarchyOutgoingCall[]): CallToolResult {
  return {
    content: outgoingCallsToTextContents(calls),
  };
}

function outgoingCallsToTextContents(calls: CallHierarchyOutgoingCall[]): TextContent[] {
  if (calls.length === 0) {
    return [{
      type: 'text',
      text: 'No outgoing calls found.',
    }];
  }
  return [{
    type: 'text',
    text: JSON.stringify(calls, null, 2),
  }];
}

function outgoingCallsNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No outgoing calls available for this item.',
    }],
  };
}
