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
import { CallHierarchyOutgoingCall, CallHierarchyItemT } from "../lsp/types/CallHierarchyRequest";

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
        item: {
          type: 'object',
          description: 'The CallHierarchyItem from prepareCallHierarchy',
          properties: {
            name: { type: 'string' },
            kind: { type: 'number' },
            uri: { type: 'string' },
            range: {
              type: 'object',
              properties: {
                start: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' },
                  },
                  required: ['line', 'character'],
                },
                end: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' },
                  },
                  required: ['line', 'character'],
                },
              },
              required: ['start', 'end'],
            },
            selectionRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' },
                  },
                  required: ['line', 'character'],
                },
                end: {
                  type: 'object',
                  properties: {
                    line: { type: 'number' },
                    character: { type: 'number' },
                  },
                  required: ['line', 'character'],
                },
              },
              required: ['start', 'end'],
            },
          },
          required: ['name', 'kind', 'uri', 'range', 'selectionRange'],
        },
      },
      required: ['item'],
    },
  };
}

const OutgoingCallsParamsT = t.type({
  item: CallHierarchyItemT,
});

async function handleOutgoingCalls(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = OutgoingCallsParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for outgoingCalls tool: ${JSON.stringify(decoded.left)}`);
  }
  const { item } = decoded.right;
  try {
    const result = await manager.outgoingCalls({ item });
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
