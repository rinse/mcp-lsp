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
import { CallHierarchyIncomingCall, CallHierarchyItemT } from "../lsp/types/CallHierarchyRequest";

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

const IncomingCallsParamsT = t.type({
  item: CallHierarchyItemT,
});

async function handleIncomingCalls(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = IncomingCallsParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for incomingCalls tool: ${JSON.stringify(decoded.left)}`);
  }
  const { item } = decoded.right;
  try {
    const result = await manager.incomingCalls({ item });
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
