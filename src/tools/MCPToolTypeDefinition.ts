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
import { TypeDefinition } from "../lsp/types/TypeDefinitionRequest";

export class MCPToolTypeDefinition implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemTypeDefinition();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleTypeDefinition(this.manager, params);
  }
}

function listItemTypeDefinition(): Tool {
  return {
    name: 'goto_type_declaration',
    description: `**Always jump straight to the canonical type declaration**
(interface / type alias / enum / class / primitive wrapper) that
defines the compile-time shape of the symbol at the given cursor
position in a TypeScript file.

👉 **You MUST call this tool whenever** the user or the agent asks
"Where is this type defined?", "Go to type", "Reveal declared
shape", "Open original interface", or any similar request.
Skip manual greps—this tool is faster, language-aware, and
guaranteed to return the precise location.

Typical trigger phrases (non-exhaustive):
  • "go to type declaration" / "goto type" / "jump to type"
  • "show original type alias"
  • "open enum definition"
  • "where is this interface declared"

Output
Plain-text block:
Found <N> type definitions:
<absPath>:<startLine>:<startCol>-<endLine>:<endCol>
...

Output Example:
Found 1 type definitions:
/home/user/project/src/types/User.ts:5:10-5:23

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
          description: 'Required. File URI (e.g. file:///path/to/file.ts)',
        },
        line: {
          type: 'number',
          description: 'Required. 0-based line index',
        },
        character: {
          type: 'number',
          description: 'Required. 0-based character index',
        },
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const TypeDefinitionParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleTypeDefinition(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = TypeDefinitionParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for typeDefinition tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    const result = await manager.typeDefinition({
      textDocument: { uri },
      position: { line, character },
    });
    return result !== null
      ? typeDefinitionToCallToolResult(result, uri, line, character)
      : typeDefinitionNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get type definition information: ${String(error)}`);
  }
}

function typeDefinitionToCallToolResult(typeDefinition: TypeDefinition, uri: string, line: number, character: number): CallToolResult {
  return {
    content: typeDefinitionToTextContents(typeDefinition, uri, line, character),
  };
}

function typeDefinitionToTextContents(typeDefinition: TypeDefinition, uri: string, line: number, character: number): TextContent[] {
  if (typeDefinition === null) {
    return [{
      type: 'text',
      text: formatNoTypeDefinitionFound(uri, line, character),
    }];
  }
  if (Array.isArray(typeDefinition)) {
    if (typeDefinition.length === 0) {
      return [{
        type: 'text',
        text: formatNoTypeDefinitionFound(uri, line, character),
      }];
    }
    return [{
      type: 'text',
      text: formatMultipleTypeDefinitions(typeDefinition),
    }];
  }
  // At this point, typeDefinition must be a Location (not null or array)
  const location: Location = typeDefinition;
  return [{
    type: 'text',
    text: formatSingleTypeDefinition(location),
  }];
}


function formatSingleTypeDefinition(location: Location): string {
  return locationToString(location);
}

function formatMultipleTypeDefinitions(locations: Location[]): string {
  const lines = [`Found ${locations.length} type definitions:`];

  for (const location of locations) {
    lines.push(`\n${locationToString(location)}`);
  }

  return lines.join('');
}

function formatNoTypeDefinitionFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No type definition found for symbol at ${filePath}:${line}:${character}`;
}

function typeDefinitionNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoTypeDefinitionFound(uri, line, character),
    }],
  };
}
