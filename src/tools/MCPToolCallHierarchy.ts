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

  getName(): string {
    return 'list_caller_locations_of';
  }

  listItem(): Tool {
    return listItemCallHierarchy(this.getName());
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleCallHierarchy(this.manager, params);
  }
}

function listItemCallHierarchy(toolName: string): Tool {
  return {
    name: toolName,
    description: `**Find all locations that call a specific function/method across the entire TypeScript project—across all files, imports, and overloads—in a single, exhaustive scan.**

**You MUST call this tool whenever** the user or agent asks "Who calls this?", "Where is this function used?", "Show call hierarchy", "Find invocations", "Trace call stack", or any similar request. Skip manual greps—this analysis is language-aware, prevents missed edges, and saves tokens by avoiding full-file loads.

Typical trigger phrases (non-exhaustive):
  • "find callers" / "show call hierarchy" / "trace calls"
  • "list functions that invoke X"
  • "who uses this method" / "where is this called"
  • "find all usages" / "show invocations"

Output
Plain text with caller count and locations:
Found N callers:
<symbolName> at <absolutePath>:<startLine>:<startChar>-<endChar>
...

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
          description: 'Required. 0-based line index where the cursor is.',
        },
        character: {
          type: 'number',
          description: 'Required. 0-based character index on that line.',
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for list_caller_locations_of tool: ${JSON.stringify(decoded.left)}`);
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
  return calls.reduce((acc, call) => {
    return call.fromRanges.reduce((lineAcc, range) => {
      const formattedLine = callHierarchyItemToString(call.from, range);
      return `${lineAcc}\n${formattedLine}`;
    }, acc);
  }, `Found ${calls.length} callers:`);
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
