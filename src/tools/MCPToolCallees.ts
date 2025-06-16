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
import { rangeToString } from "./utils";
import { LSPManager } from "../lsp/LSPManager";
import { CallHierarchyOutgoingCall, CallHierarchyItem, SymbolKind } from "../lsp/types/CallHierarchyRequest";

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
      return calleesNothingContent();
    }
    // Use the first item to get outgoing calls
    const result = await manager.outgoingCalls({ item: prepareResult[0] });
    return result !== null
      ? calleesToCallToolResult(result)
      : calleesNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get outgoing calls: ${String(error)}`);
  }
}

function calleesToCallToolResult(calls: CallHierarchyOutgoingCall[]): CallToolResult {
  return {
    content: calleesToTextContents(calls),
  };
}

function calleesToTextContents(calls: CallHierarchyOutgoingCall[]): TextContent[] {
  if (calls.length === 0) {
    return [{
      type: 'text',
      text: 'No callees found.',
    }];
  }
  const lines: string[] = [`Found ${calls.length} callee${calls.length > 1 ? 's' : ''}:`];
  calls.forEach((call) => {
    lines.push(`  ${callHierarchyItemToString(call.to)}`);
    call.fromRanges.forEach((range) => {
      lines.push(`    called at line ${rangeToString(range)}`);
    });
  });
  return [{
    type: 'text',
    text: lines.join('\n'),
  }];
}

function callHierarchyItemToString(item: CallHierarchyItem): string {
  const filePath = item.uri.replace('file://', '');
  const start = item.selectionRange.start;
  const position = `${filePath}:${start.line + 1}:${start.character + 1}`;
  const kind = symbolKindToString(item.kind);
  const detail = item.detail ? ` - ${item.detail}` : '';
  return `${item.name} (${kind}) at ${position}${detail}`;
}

function symbolKindToString(kind: SymbolKind): string {
  const kinds: Record<number, string> = {
    1: 'File',
    2: 'Module',
    3: 'Namespace',
    4: 'Package',
    5: 'Class',
    6: 'Method',
    7: 'Property',
    8: 'Field',
    9: 'Constructor',
    10: 'Enum',
    11: 'Interface',
    12: 'Function',
    13: 'Variable',
    14: 'Constant',
    15: 'String',
    16: 'Number',
    17: 'Boolean',
    18: 'Array',
    19: 'Object',
    20: 'Key',
    21: 'Null',
    22: 'EnumMember',
    23: 'Struct',
    24: 'Event',
    25: 'Operator',
    26: 'TypeParameter',
  };
  return kinds[kind] || `Unknown(${kind})`;
}

function calleesNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No callees available for this item.',
    }],
  };
}
