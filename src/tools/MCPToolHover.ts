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
import { Hover } from "../lsp/types/HoverRequest";
import { MarkedStringT } from "../lsp/types/MarkedString";
import { MarkupContentT } from "../lsp/types/MarkupContent";

/**
 * MCPToolHover is a wrapper of the Hover tool for {@link MCPTool}.
 *
 * The functionarity is delegated to {@link LSPServerEx#hover}.
 */
export class MCPToolHover implements MCPTool {
  constructor(private manager: LSPManager) {}

  getName(): string {
    return 'get_hover_info';
  }

  listItem(): Tool {
    return listItemHover(this.getName());
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleHover(this.manager, params);
  }
}

function listItemHover(toolName: string): Tool {
  return {
    name: toolName,
    description: `Retrieve hover information (type signature and inline documentation) for the symbol located at a specific cursor position in a TypeScript. Use it whenever the agent—or the end-user—asks “What is the type / doc of this identifier?” or needs quick symbol details without parsing the whole file.

When to call
* The user / agent wants the type, return-type, overload list, or TSDoc of an identifier.
* Typical questions: "What’s the type of foo?", "Show docs for this function", "Explain what this variable is".

Output
Plain-text block in the form:
<path>:<line>:<character>
  Type: <inferred-type or signature>
  Docs: <first JSDoc/JSDoc-like sentence>

Output Example:
/test/file.ts:10:5
  Type: function listItemCallees(): Tool
  Docs: Prints how to use the list_callee_locations tool.

Limits / notes
* Only .ts / .tsx files currently supported
* The file must exist on disk (unsaved buffers not supported).
* Very large files (>2 MB) may degrade latency.
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
          description: 'Required. 0-based character (column) index on that line.',
        },
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const HoverParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleHover(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = HoverParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for get_hover_info tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    const result = await manager.hover({
      textDocument: { uri },
      position: { line, character },
    });
    return result !== null
      ? hoverToCallToolResult(result, uri, line, character)
      : hoverNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get hover information: ${String(error)}`);
  }
}

function hoverToCallToolResult(hover: Hover, uri: string, line: number, character: number): CallToolResult {
  return {
    content: hoverToTextContents(hover, uri, line, character),
  };
}

function hoverToTextContents(hover: Hover, uri: string, line: number, character: number): TextContent[] {
  // Convert URI to file path for display
  const filePath = uri.replace('file://', '');
  const header = `${filePath}:${line}:${character}`;
  const content = formatHoverContent(hover.contents);

  return [{
    type: 'text',
    text: `${header}\n${content}`,
  }];
}

function formatHoverContent(contents: Hover['contents']): string {
  // Extract type and documentation from the hover content
  let typeInfo = '';
  let documentation = '';
  if (typeof contents === 'string') {
    // Simple string content
    typeInfo = contents;
  } else if (MarkedStringT.is(contents)) {
    // MarkedString object
    if (typeof contents === 'object' && 'language' in contents) {
      typeInfo = contents.value;
    }
  } else if (t.array(MarkedStringT).is(contents)) {
    // Array of MarkedString
    const parts: string[] = [];
    for (const item of contents) {
      if (typeof item === 'string') {
        parts.push(item);
      } else if (item.language === 'typescript' || item.language === 'javascript') {
        // Type information usually comes in code blocks
        typeInfo = item.value;
      } else {
        // Other content (often documentation)
        parts.push(item.value);
      }
    }
    if (!typeInfo && parts.length > 0) {
      typeInfo = parts[0];
      documentation = parts.slice(1).join('\n');
    } else {
      documentation = parts.join('\n');
    }
  } else if (MarkupContentT.is(contents)) {
    // MarkupContent (markdown or plaintext)
    const lines = contents.value.split('\n');
    // Often the first line or code block contains the type
    const codeBlockMatch = /```(?:typescript|javascript|ts|js)?\n([^`]+)\n```/.exec(contents.value);
    if (codeBlockMatch) {
      typeInfo = codeBlockMatch[1].trim();
      // Remove the code block from documentation
      documentation = contents.value.replace(codeBlockMatch[0], '').trim();
    } else if (lines.length > 0) {
      // First line might be the type
      typeInfo = lines[0];
      documentation = lines.slice(1).join('\n').trim();
    }
  }
  // Format the output according to our new standard
  let output = '';

  // Add type information if available
  if (typeInfo) {
    output += `  Type: ${typeInfo.trim()}`;
  }

  // Add documentation if available
  if (documentation) {
    const docLines = documentation.split('\n').filter(line => line.trim());
    if (docLines.length > 0) {
      if (output) output += '\n';
      output += `  Docs: ${docLines.join('\n        ')}`;
    }
  }
  return output || '  No hover information available';
}

function hoverNothingContent(uri: string, line: number, character: number): CallToolResult {
  const filePath = uri.replace('file://', '');
  const header = `${filePath}:${line}:${character}`;

  return {
    content: [{
      type: 'text',
      text: `${header}\n  No hover information available`,
    }],
  };
}
