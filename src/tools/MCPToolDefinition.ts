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
import { Definition } from "../lsp/types/DefinitionRequest";
import { Location } from "../lsp/types/Location";

export class MCPToolDefinition implements MCPTool {
  constructor(private manager: LSPManager) {}

  getName(): string {
    return 'list_definition_locations';
  }

  listItem(): Tool {
    return listItemDefinition(this.getName());
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleDefinition(this.manager, params);
  }
}

function listItemDefinition(toolName: string): Tool {
  return {
    name: toolName,
    description: `Locate and return source-code definition site(s) (declarations or implementations) for the symbol under the given cursor position in a TypeScript / JavaScript file.

When to call
* The agent needs to "go to definition" while reading or analysing code,
  e.g. to inspect a function body, view an interface that a class implements, verify a variable's scope, or discover additional object fields.
* Typical user prompts: "Where is foo defined?", "Open the declaration of this method", "Jump to the interface for this class".

Output
Plain-text block:
Found <N> definitions:
<absPath>:<startLine>:<startCol>-<endLine>:<endCol>
...

Output Example (single hit):
Found 1 definitions:
/home/user/project/src/lsp/LSPServerStream.ts:11:13-11:28

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
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const DefinitionParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleDefinition(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = DefinitionParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for list_definition_locations tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    const result = await manager.definition({
      textDocument: { uri },
      position: { line, character },
    });
    return result !== null
      ? definitionToCallToolResult(result, uri, line, character)
      : definitionNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get definition information: ${String(error)}`);
  }
}

function definitionToCallToolResult(definition: Definition, uri: string, line: number, character: number): CallToolResult {
  return {
    content: definitionToTextContents(definition, uri, line, character),
  };
}

function definitionToTextContents(definition: Definition, uri: string, line: number, character: number): TextContent[] {
  if (definition === null) {
    return [{
      type: 'text',
      text: formatNoDefinitionFound(uri, line, character),
    }];
  }
  if (Array.isArray(definition)) {
    if (definition.length === 0) {
      return [{
        type: 'text',
        text: formatNoDefinitionFound(uri, line, character),
      }];
    }
    return [{
      type: 'text',
      text: formatMultipleDefinitions(definition),
    }];
  }
  return [{
    type: 'text',
    text: formatSingleDefinition(definition),
  }];
}

function formatSingleDefinition(location: Location): string {
  return locationToString(location);
}

function formatMultipleDefinitions(locations: Location[]): string {
  const lines = [`Found ${locations.length} definitions:`];

  for (const location of locations) {
    lines.push(`\n${locationToString(location)}`);
  }

  return lines.join('');
}

function formatNoDefinitionFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No definition found for symbol at ${filePath}:${line}:${character}`;
}

function definitionNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoDefinitionFound(uri, line, character),
    }],
  };
}
