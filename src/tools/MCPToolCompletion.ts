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
import {
  CompletionResult,
  CompletionItem,
  CompletionItemKind,
  CompletionTriggerKind,
} from "../lsp/types/CompletionRequest";

export class MCPToolCompletion implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemCompletion();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleCompletion(this.manager, params);
  }
}

function listItemCompletion(): Tool {
  return {
    name: 'completion',
    description: 'Get code completion suggestions for a position in a TypeScript file',
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
        triggerKind: {
          type: 'number',
          description: 'Completion trigger kind: 1=Invoked, 2=TriggerCharacter, 3=TriggerForIncompleteCompletions',
          enum: [1, 2, 3],
        },
        triggerCharacter: {
          type: 'string',
          description: 'The character that triggered completion (when triggerKind is 2)',
        },
      },
      required: ['uri', 'line', 'character'],
    },
  };
}

const CompletionParamsT = t.intersection([
  t.type({
    uri: t.string,
    line: t.number,
    character: t.number,
  }),
  t.partial({
    triggerKind: t.union([t.literal(1), t.literal(2), t.literal(3)]),
    triggerCharacter: t.string,
  }),
]);

async function handleCompletion(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = CompletionParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for completion tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character, triggerKind, triggerCharacter } = decoded.right;
  try {
    const result = await manager.completion({
      textDocument: { uri },
      position: { line, character },
      context: triggerKind !== undefined ? {
        triggerKind: triggerKind as CompletionTriggerKind,
        triggerCharacter,
      } : undefined,
    });
    return result !== null
      ? completionToCallToolResult(result)
      : completionNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get completion information: ${String(error)}`);
  }
}

function completionToCallToolResult(result: CompletionResult): CallToolResult {
  return {
    content: completionToTextContents(result),
  };
}

function completionToTextContents(result: CompletionResult): TextContent[] {
  if (result === null) {
    return [{
      type: 'text',
      text: 'No completions available.',
    }];
  }
  if (Array.isArray(result)) {
    return [{
      type: 'text',
      text: JSON.stringify(result.map(formatCompletionItem), null, 2),
    }];
  }
  const completionList = result;
  return [{
    type: 'text',
    text: JSON.stringify({
      isIncomplete: completionList.isIncomplete,
      items: completionList.items.map(formatCompletionItem),
    }, null, 2),
  }];
}

function formatCompletionItem(item: CompletionItem): Record<string, unknown> {
  return {
    label: item.label,
    kind: item.kind !== undefined ? getCompletionItemKindName(item.kind) : undefined,
    detail: item.detail,
    documentation: item.documentation,
    insertText: item.insertText ?? item.label,
    sortText: item.sortText,
    filterText: item.filterText,
  };
}

function getCompletionItemKindName(kind: CompletionItemKind): string {
  switch (kind) {
    case CompletionItemKind.Text: return 'Text';
    case CompletionItemKind.Method: return 'Method';
    case CompletionItemKind.Function: return 'Function';
    case CompletionItemKind.Constructor: return 'Constructor';
    case CompletionItemKind.Field: return 'Field';
    case CompletionItemKind.Variable: return 'Variable';
    case CompletionItemKind.Class: return 'Class';
    case CompletionItemKind.Interface: return 'Interface';
    case CompletionItemKind.Module: return 'Module';
    case CompletionItemKind.Property: return 'Property';
    case CompletionItemKind.Unit: return 'Unit';
    case CompletionItemKind.Value: return 'Value';
    case CompletionItemKind.Enum: return 'Enum';
    case CompletionItemKind.Keyword: return 'Keyword';
    case CompletionItemKind.Snippet: return 'Snippet';
    case CompletionItemKind.Color: return 'Color';
    case CompletionItemKind.File: return 'File';
    case CompletionItemKind.Reference: return 'Reference';
    case CompletionItemKind.Folder: return 'Folder';
    case CompletionItemKind.EnumMember: return 'EnumMember';
    case CompletionItemKind.Constant: return 'Constant';
    case CompletionItemKind.Struct: return 'Struct';
    case CompletionItemKind.Event: return 'Event';
    case CompletionItemKind.Operator: return 'Operator';
    case CompletionItemKind.TypeParameter: return 'TypeParameter';
    default: return 'Unknown';
  }
}

function completionNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No completions available.',
    }],
  };
}
