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
import { CallHierarchyIncomingCall } from "../lsp/types/CallHierarchyRequest";

export class MCPToolCallHierarchy implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemCallHierarchy();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleCallHierarchy(this.manager, params);
  }
}

function listItemCallHierarchy(): Tool {
  return {
    name: 'callHierarchy',
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

const CallHierarchyParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleCallHierarchy(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = CallHierarchyParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for callHierarchy tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    // First prepare call hierarchy
    const prepareResult = await manager.prepareCallHierarchy({
      textDocument: { uri },
      position: { line, character },
    });
    if (prepareResult === null || prepareResult.length === 0) {
      return callHierarchyNothingContent(uri, line, character);
    }
    // Use the first item to get incoming calls
    const result = await manager.incomingCalls({ item: prepareResult[0] });
    return result !== null
      ? callHierarchyToCallToolResult(result, uri, line, character)
      : callHierarchyNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get incoming calls: ${String(error)}`);
  }
}

function callHierarchyToCallToolResult(calls: CallHierarchyIncomingCall[], uri: string, line: number, character: number): CallToolResult {
  return {
    content: callHierarchyToTextContents(calls, uri, line, character),
  };
}

function callHierarchyToTextContents(calls: CallHierarchyIncomingCall[], uri: string, line: number, character: number): TextContent[] {
  if (calls.length === 0) {
    return [{
      type: 'text',
      text: formatNoCallersFound(uri, line, character),
    }];
  }
  return [{
    type: 'text',
    text: formatMultipleCallers(calls),
  }];
}

function formatMultipleCallers(calls: CallHierarchyIncomingCall[]): string {
  const lines = [`Found ${calls.length} callers:`];

  for (const call of calls) {
    for (const range of call.fromRanges) {
      // Use callHierarchyItemToString with the specific range
      const formattedLine = callHierarchyItemToString(call.from, range);
      lines.push(`\n${formattedLine}`);
    }
  }

  return lines.join('');
}

function formatNoCallersFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No callers found for symbol at ${filePath}:${line}:${character}`;
}

function callHierarchyNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoCallersFound(uri, line, character),
    }],
  };
}
