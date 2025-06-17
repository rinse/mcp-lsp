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
      ? implementationToCallToolResult(result, uri, line, character)
      : implementationNothingContent(uri, line, character);
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get implementation information: ${String(error)}`);
  }
}

function implementationToCallToolResult(implementation: Implementation, uri: string, line: number, character: number): CallToolResult {
  return {
    content: implementationToTextContents(implementation, uri, line, character),
  };
}

function implementationToTextContents(implementation: Implementation, uri: string, line: number, character: number): TextContent[] {
  if (implementation === null) {
    return [{
      type: 'text',
      text: formatNoImplementationFound(uri, line, character),
    }];
  }
  if (Array.isArray(implementation)) {
    if (implementation.length === 0) {
      return [{
        type: 'text',
        text: formatNoImplementationFound(uri, line, character),
      }];
    }
    return [{
      type: 'text',
      text: formatMultipleImplementations(implementation),
    }];
  }
  return [{
    type: 'text',
    text: formatSingleImplementation(implementation),
  }];
}


function formatSingleImplementation(location: Location): string {
  const filePath = location.uri.replace('file://', '');
  const line = location.range.start.line;
  const character = location.range.start.character;

  return `${filePath}:${line}:${character}`;
}

function formatMultipleImplementations(locations: Location[]): string {
  const lines = [`Found ${locations.length} implementations:`];

  for (const location of locations) {
    const filePath = location.uri.replace('file://', '');
    const line = location.range.start.line;
    const character = location.range.start.character;
    lines.push(`\n${filePath}:${line}:${character}`);
  }

  return lines.join('');
}

function formatNoImplementationFound(uri: string, line: number, character: number): string {
  const filePath = uri.replace('file://', '');
  return `No implementations found for symbol at ${filePath}:${line}:${character}`;
}

function implementationNothingContent(uri: string, line: number, character: number): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: formatNoImplementationFound(uri, line, character),
    }],
  };
}
