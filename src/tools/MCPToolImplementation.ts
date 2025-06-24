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
import { Implementation } from "../lsp/types/ImplementationRequest";
import { Location } from "../lsp/types/Location";

export class MCPToolImplementation implements MCPTool {
  constructor(private manager: LSPManager) {}

  getName(): string {
    return 'list_implementation_locations';
  }

  listItem(): Tool {
    return listItemImplementation(this.getName());
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleImplementation(this.manager, params);
  }
}

function listItemImplementation(toolName: string): Tool {
  return {
    name: toolName,
    description: `Locate and return source-code implementation sites for the symbol at the given cursor position in a TypeScript file.

## When to call
* The user / agent asks "Where is this interface/method implemented?", "Show all overrides of X", "Find concrete subclasses".
* Typical trigger phrases: "find implementations", "list implementations", "find overrides", "list overrides", "who implements", "show concrete classes of", "subclasses of".

## Locating a symbol
\`\`\`
awk -v pat='<PATTERN>' '{pos=index($0, pat); if (pos) print NR-1 ":" pos-1 ":" $0}'
\`\`\`

## Output
Plain-text block:
Found <N> implementations:
<absPath>:<startLine>:<startCol>-<endLine>:<endCol>
...

## Output Example:
Found 3 implementations:
/home/user/project/src/services/UserService.ts:15:13-15:28
/home/user/project/src/mocks/MockUserService.ts:8:13-8:28
/home/user/project/src/tests/TestUserService.ts:12:13-12:28

## Notes & limits
* Only .ts / .tsx files currently supported
* The file must exist on disk (unsaved buffers not supported).
* Very large files (> 2 MB) may increase latency.`,
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
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for list_implementation_locations tool: ${JSON.stringify(decoded.left)}`);
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
  return locationToString(location);
}

function formatMultipleImplementations(locations: Location[]): string {
  const lines = [`Found ${locations.length} implementations:`];

  for (const location of locations) {
    lines.push(`\n${locationToString(location)}`);
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
