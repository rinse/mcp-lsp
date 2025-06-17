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
    name: 'typeDefinition',
    description: 'Get type definition location for a symbol at a specific position in a TypeScript file',
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
