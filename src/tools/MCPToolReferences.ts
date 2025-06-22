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
import { locationToString } from "./utils";
import { LSPManager } from "../lsp/LSPManager";
import { Location } from "../lsp/types/Location";
import { References } from "../lsp/types/ReferencesRequest";

export class MCPToolReferences implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemReferences();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleReferences(this.manager, params);
  }
}

function listItemReferences(): Tool {
  return {
    name: 'list_symbol_references',
    description: `Get all references to a symbol at a specific position in a TypeScript file

## Use this tool whenever:
- You (or the user) ask "What’s the type / doc of …?"
- You want the overload list, parameter types, or quick docs for a function or method.
- You are deciding whether to jump to the definition or read the call-site comments.

## Typical trigger phrases the agent should react to ⬇
"find references", "show references", "list references", "find usages", "show usages", "list usages",
"where is this used", "who uses", "who calls", "caller list", "trace call chain", "trace usage path", "impact analysis",
"どこで使われている", "参照を探す", "関数呼び出しを辿る", "辿る" "使用箇所", "利用箇所", "呼び出し元", "影響範囲"

Output
Plain-text block:
Found <N> references:
<absPath>:<startLine>:<startCol>-<endLine>:<endCol>
...

Output Example:
Found 27 references:
/home/user/project/src/tools/MCPTool.ts:6:17-6:24
/home/user/project/src/mcp/MCPServer.ts:3:9-3:16
...

Notes & limits
* Only .ts / .tsx files currently supported
* The file must exist on disk (unsaved buffers not supported).
* Very large files (> 2 MB) may increase latency.
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
          description: 'Required. 0-based line index of the cursor.',
        },
        character: {
          type: 'number',
          description: 'Required. 0-based character (column) index.',
        },
        includeDeclaration: {
          type: 'boolean',
          description: 'Whether to include the symbol declaration in the results (defaults to true)',
        },
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const ReferencesParamsT = t.intersection([
  t.type({
    uri: t.string,
    line: t.number,
    character: t.number,
  }),
  t.partial({
    includeDeclaration: t.boolean,
  }),
]);

async function handleReferences(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = ReferencesParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for list_symbol_references tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character, includeDeclaration = true } = decoded.right;
  try {
    const result = await manager.references({
      textDocument: { uri },
      position: { line, character },
      context: { includeDeclaration },
    });
    return result !== null
      ? referencesToCallToolResult(result, uri, line, character)
      : referencesNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get references information: ${String(error)}`);
  }
}

function referencesToCallToolResult(references: References, uri: string, line: number, character: number): CallToolResult {
  return {
    content: referencesToTextContents(references, uri, line, character),
  };
}

function referencesToTextContents(references: References, uri: string, line: number, character: number): TextContent[] {
  if (references === null || references.length === 0) {
    return [{
      type: 'text',
      text: formatNoReferencesFound(uri, line, character),
    }];
  }
  return [{
    type: 'text',
    text: formatMultipleReferences(references),
  }];
}


function formatMultipleReferences(locations: Location[]): string {
  const lines = [`Found ${locations.length} references:`];

  for (const location of locations) {
    lines.push(`\n${locationToString(location)}`);
  }

  return lines.join('');
}

function formatNoReferencesFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No references found for symbol at ${filePath}:${line}:${character}`;
}

function referencesNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoReferencesFound(uri, line, character),
    }],
  };
}
