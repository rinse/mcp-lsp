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
    name: 'references',
    description: 'Get all references to a symbol at a specific position in a TypeScript file',
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for references tool: ${JSON.stringify(decoded.left)}`);
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
