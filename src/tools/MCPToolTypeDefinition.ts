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
      ? typeDefinitionToCallToolResult(result)
      : typeDefinitionNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get type definition information: ${String(error)}`);
  }
}

function typeDefinitionToCallToolResult(typeDefinition: TypeDefinition): CallToolResult {
  return {
    content: typeDefinitionToTextContents(typeDefinition),
  };
}

function typeDefinitionToTextContents(typeDefinition: TypeDefinition): TextContent[] {
  if (typeDefinition === null) {
    return [{
      type: 'text',
      text: 'No type definition found.',
    }];
  }
  if (Array.isArray(typeDefinition)) {
    if (typeDefinition.length === 1) {
      return [{
        type: 'text',
        text: locationToString(typeDefinition[0]),
      }];
    }
    return [{
      type: 'text',
      text: `Found ${typeDefinition.length} type definitions:\n${typeDefinition
        .map(location => `  ${locationToString(location)}`)
        .join('\n')}`,
    }];
  }
  return [{
    type: 'text',
    text: locationToString(typeDefinition),
  }];
}

function locationToString(location: Location): string {
  const filePath = location.uri.replace('file://', '');
  const start = location.range.start;
  const end = location.range.end;
  const startPos = `${start.line + 1}:${start.character + 1}`;

  // For single-position ranges (same start and end)
  if (start.line === end.line && start.character === end.character) {
    return `${filePath}:${startPos}`;
  }

  // For multi-line ranges, use Go-style format
  return `${filePath}:${startPos}-${end.line + 1}:${end.character + 1}`;
}

function typeDefinitionNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No type definition found.',
    }],
  };
}