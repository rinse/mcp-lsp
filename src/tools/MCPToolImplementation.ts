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
import { Implementation } from "../lsp/types/ImplementationRequest";
import { Location } from "../lsp/types/Location";

export class MCPToolImplementation implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemImplementation();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleImplementation(this.manager, params);
  }
}

function listItemImplementation(): Tool {
  return {
    name: 'implementation',
    description: 'Get implementation location for a symbol at a specific position in a TypeScript file',
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

const ImplementationParamsT = t.type({
  uri: t.string,
  line: t.number,
  character: t.number,
});

async function handleImplementation(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = ImplementationParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for implementation tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character } = decoded.right;
  try {
    const result = await manager.implementation({
      textDocument: { uri },
      position: { line, character },
    });
    return result !== null
      ? implementationToCallToolResult(result)
      : implementationNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get implementation information: ${String(error)}`);
  }
}

function implementationToCallToolResult(implementation: Implementation): CallToolResult {
  return {
    content: implementationToTextContents(implementation),
  };
}

function implementationToTextContents(implementation: Implementation): TextContent[] {
  if (implementation === null) {
    return [{
      type: 'text',
      text: 'No implementation found.',
    }];
  }
  if (Array.isArray(implementation)) {
    return implementation.map((location, index) => ({
      type: 'text',
      text: `Implementation ${index + 1}: ${locationToString(location)}`,
    }));
  }
  return [{
    type: 'text',
    text: `Implementation: ${locationToString(implementation)}`,
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

function implementationNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No implementation found.',
    }],
  };
}