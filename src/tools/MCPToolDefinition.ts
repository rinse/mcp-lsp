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
import { Definition } from "../lsp/types/DefinitionRequest";
import { Location } from "../lsp/types/Location";

export class MCPToolDefinition implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemDefinition();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleDefinition(this.manager, params);
  }
}

function listItemDefinition(): Tool {
  return {
    name: 'definition',
    description: 'Get definition location for a symbol at a specific position in a TypeScript file',
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for definition tool: ${JSON.stringify(decoded.left)}`);
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
  const filePath = location.uri.replace('file://', '');
  const line = location.range.start.line;
  const character = location.range.start.character;

  return `${filePath}:${line}:${character}`;
}

function formatMultipleDefinitions(locations: Location[]): string {
  const lines = [`Found ${locations.length} definitions:`];

  for (const location of locations) {
    const filePath = location.uri.replace('file://', '');
    const line = location.range.start.line;
    const character = location.range.start.character;
    lines.push(`\n${filePath}:${line}:${character}`);
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
