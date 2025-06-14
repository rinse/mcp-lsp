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
      ? definitionToCallToolResult(result)
      : definitionNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get definition information: ${String(error)}`);
  }
}

function definitionToCallToolResult(definition: Definition): CallToolResult {
  return {
    content: definitionToTextContents(definition),
  };
}

function definitionToTextContents(definition: Definition): TextContent[] {
  if (definition === null) {
    return [{
      type: 'text',
      text: 'No definition found.',
    }];
  }
  if (Array.isArray(definition)) {
    return definition.map((location, index) => ({
      type: 'text',
      text: `Definition ${index + 1}: ${locationToString(location)}`,
    }));
  }
  return [{
    type: 'text',
    text: `Definition: ${locationToString(definition)}`,
  }];
}

function locationToString(location: Location): string {
  const filePath = location.uri.replace('file://', '');
  const start = location.range.start;
  const end = location.range.end;
  const startPos = `${start.line + 1}:${start.character + 1}`;
  if (start.line !== end.line || start.character !== end.character) {
    return `${filePath}:${startPos} to ${end.line + 1}:${end.character + 1}`;
  }
  return `${filePath}:${startPos}`;
}

function definitionNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No definition found.',
    }],
  };
}
