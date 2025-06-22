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
    name: 'find_callee_locations',
    description: `Find all functions/methods that a specific function calls across the entire TypeScript project—including dynamic dispatch, overloads, and imported helpers—in a single, exhaustive, language-aware scan.

**You MUST call this tool whenever** the user or agent asks "What does this function call?", "Show callee list", "Trace outbound calls", "Expand call hierarchy ↓", "List invoked helpers", or any similar request. Skip manual code reading—this analysis is language-aware, prevents missed callees, and saves tokens by avoiding the need to load every file into context.

Typical trigger phrases (non-exhaustive):
  • "find callees" / "show callee hierarchy" / "trace outbound calls"
  • "list functions called by X"
  • "what does this method invoke" / "where does this function delegate to"
  • "show downstream calls" / "expand call tree"

Output
Plain text with callee count and locations:
Found N callees:
<calleeName> at <absolutePath>:<startLine>:<startChar>-<endChar>
...

Output Examples:
\`\`\`
Found 3 callees:
readFile at /home/user/project/src/utils/fileUtils.ts:15:8-15:16
writeFile at /home/user/project/src/utils/fileUtils.ts:25:8-25:17
logger.info at /home/user/project/src/utils/logger.ts:10:0-10:11
\`\`\`

Notes & limits
* Only .ts / .tsx files currently supported
* The file must exist on disk (unsaved buffers not supported)
* Very large files (>2 MB) may increase latency
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
          description: 'Required. 0-based line index where the cursor is located',
        },
        character: {
          type: 'number',
          description: 'Required. 0-based character index on that line',
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for find_callee_locations tool: ${JSON.stringify(decoded.left)}`);
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
  return calls.reduce((acc, call) => {
    const formattedLine = callHierarchyItemToString(call.to, call.to.selectionRange);
    return `${acc}\n${formattedLine}`;
  }, `Found ${calls.length} callees:`);
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
