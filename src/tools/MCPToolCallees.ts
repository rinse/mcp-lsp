import {
  ErrorCode,
  McpError,
  type CallToolRequest,
  type CallToolResult,
  type TextContent,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as t from "io-ts";

import { callHierarchyItemToString } from "./formats/CallHierarchyItem";
import { MCPTool } from "./MCPTool";
import { LSPManager } from "../lsp/LSPManager";
import { CallHierarchyOutgoingCall } from "../lsp/types/CallHierarchyRequest";

export class MCPToolCallees implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemCallees();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleCallees(this.manager, params);
  }
}

function listItemCallees(): Tool {
  return {
    name: 'callees',
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

const CalleesParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleCallees(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = CalleesParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for callees tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    // First prepare call hierarchy
    const prepareResult = await manager.prepareCallHierarchy({
      textDocument: { uri },
      position: { line, character },
    });
    if (prepareResult === null || prepareResult.length === 0) {
      return calleesNothingContent(uri, line, character);
    }
    // Use the first item to get outgoing calls
    const result = await manager.outgoingCalls({ item: prepareResult[0] });
    return result !== null
      ? calleesToCallToolResult(result, uri, line, character)
      : calleesNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get outgoing calls: ${String(error)}`);
  }
}

function calleesToCallToolResult(calls: CallHierarchyOutgoingCall[], uri: string, line: number, character: number): CallToolResult {
  return {
    content: calleesToTextContents(calls, uri, line, character),
  };
}

function calleesToTextContents(calls: CallHierarchyOutgoingCall[], uri: string, line: number, character: number): TextContent[] {
  if (calls.length === 0) {
    return [{
      type: 'text',
      text: formatNoCalleesFound(uri, line, character),
    }];
  }
  return [{
    type: 'text',
    text: formatMultipleCallees(calls),
  }];
}

function formatMultipleCallees(calls: CallHierarchyOutgoingCall[]): string {
  const lines = [`Found ${calls.length} callees:`];

  for (const call of calls) {
    // Use callHierarchyItemToString with the selectionRange
    const formattedLine = callHierarchyItemToString(call.to, call.to.selectionRange);
    lines.push(`\n${formattedLine}`);
  }

  return lines.join('');
}

function formatNoCalleesFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No callees found for symbol at ${filePath}:${line}:${character}`;
}

function calleesNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoCalleesFound(uri, line, character),
    }],
  };
}
