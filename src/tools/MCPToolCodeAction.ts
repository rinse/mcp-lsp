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
import { CodeAction, CodeActionKind, CodeActionResult, Command, DiagnosticSeverity } from "../lsp/types/CodeActionRequest";

export class MCPToolCodeAction implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemCodeAction();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleCodeAction(this.manager, params);
  }
}

function listItemCodeAction(): Tool {
  return {
    name: 'list_available_code_actions',
    description: 'Get code actions (quick fixes, refactorings, source actions) for a range in a TypeScript file',
    inputSchema: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          description: 'File URI (e.g., file:///path/to/file.ts)',
        },
        line: {
          type: 'number',
          description: 'Start line number (0-based)',
        },
        character: {
          type: 'number',
          description: 'Start character position (0-based)',
        },
        endLine: {
          type: 'number',
          description: 'End line number (0-based)',
        },
        endCharacter: {
          type: 'number',
          description: 'End character position (0-based)',
        },
        diagnostics: {
          type: 'array',
          description: 'Array of diagnostic objects to filter code actions (optional)',
          items: {
            type: 'object',
            properties: {
              range: {
                type: 'object',
                properties: {
                  start: {
                    type: 'object',
                    properties: {
                      line: { type: 'number' },
                      character: { type: 'number' },
                    },
                    required: ['line', 'character'],
                  },
                  end: {
                    type: 'object',
                    properties: {
                      line: { type: 'number' },
                      character: { type: 'number' },
                    },
                    required: ['line', 'character'],
                  },
                },
                required: ['start', 'end'],
              },
              message: { type: 'string' },
              severity: { type: 'number' },
              code: { type: ['number', 'string'] },
              source: { type: 'string' },
            },
            required: ['range', 'message'],
          },
        },
        only: {
          type: 'array',
          description: 'Array of CodeActionKind strings to filter by action type (optional)',
          items: { type: 'string' },
        },
      },
      required: ['uri', 'line', 'character', 'endLine', 'endCharacter'],
    },
  };
}

const CodeActionParamsT = t.intersection([
  t.type({
    uri: t.string,
    line: t.number,
    character: t.number,
    endLine: t.number,
    endCharacter: t.number,
  }),
  t.partial({
    diagnostics: t.array(
      t.intersection([
        t.type({
          range: t.type({
            start: t.type({
              line: t.number,
              character: t.number,
            }),
            end: t.type({
              line: t.number,
              character: t.number,
            }),
          }),
          message: t.string,
        }),
        t.partial({
          severity: t.number,
          code: t.union([t.number, t.string]),
          source: t.string,
        }),
      ]),
    ),
    only: t.array(t.string),
  }),
]);

async function handleCodeAction(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = CodeActionParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for list_available_code_actions tool: ${JSON.stringify(decoded.left)}`);
  }
  const { uri, line, character, endLine, endCharacter, diagnostics, only } = decoded.right;
  try {
    const result = await manager.codeAction({
      textDocument: { uri },
      range: {
        start: { line, character },
        end: { line: endLine, character: endCharacter },
      },
      context: {
        diagnostics: diagnostics ?? [],
        only: only as CodeActionKind[] | undefined,
      },
    });
    return result !== null
      ? codeActionToCallToolResult(result)
      : codeActionNothingContent();
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to get code actions: ${String(error)}`);
  }
}

function codeActionToCallToolResult(result: CodeActionResult): CallToolResult {
  if (result === null) {
    return codeActionNothingContent();
  }
  return {
    content: codeActionToTextContents(result),
  };
}

function codeActionToTextContents(result: CodeActionResult): TextContent[] {
  if (result === null || result.length === 0) {
    return [{
      type: 'text',
      text: 'No code actions available.',
    }];
  }
  const headerContent: TextContent = {
    type: 'text',
    text: `Found ${result.length} code action(s):`,
  };
  const actionContents: TextContent[] = result.map((action, index) => {
    if (isCodeAction(action)) {
      return {
        type: 'text',
        text: formatCodeAction(action, index + 1),
      };
    } else if (isCommand(action)) {
      return {
        type: 'text',
        text: formatCommand(action, index + 1),
      };
    }
    return {
      type: 'text',
      text: `${index + 1}. Unknown action type: ${(action as { title?: string }).title ?? 'No title'}`,
    };
  });
  return [headerContent, ...actionContents];
}

function isCodeAction(action: CodeAction | Command): action is CodeAction {
  return 'title' in action && ('edit' in action || 'kind' in action);
}

function isCommand(action: CodeAction | Command): action is Command {
  return 'title' in action && 'command' in action && !('kind' in action) && !('edit' in action);
}

function formatCodeAction(action: CodeAction, index: number): string {
  // Create clean object for executeCodeAction tool (remove undefined fields)
  const cleanAction: Partial<CodeAction> = {
    title: action.title,
  };
  if (action.kind) cleanAction.kind = action.kind;
  if (action.isPreferred) cleanAction.isPreferred = action.isPreferred;
  if (action.disabled) cleanAction.disabled = action.disabled;
  if (action.edit) cleanAction.edit = action.edit;
  if (action.command) cleanAction.command = action.command;
  if (action.diagnostics) cleanAction.diagnostics = action.diagnostics;

  const actionJson = JSON.stringify(cleanAction, null, 2);

  let result = `\n${index}. ${action.title}`;
  if (action.kind) {
    result += ` (${action.kind})`;
  }
  if (action.isPreferred) {
    result += ' [PREFERRED]';
  }
  if (action.disabled) {
    result += ` [DISABLED: ${action.disabled.reason}]`;
  }
  result += `\n   📋 For executeCodeAction tool:\n${actionJson}`;

  // Add human-readable summary
  if (action.diagnostics && action.diagnostics.length > 0) {
    result += '\n   📝 Addresses diagnostics:';
    action.diagnostics.forEach(diagnostic => {
      const severity = getSeverityString(diagnostic.severity);
      result += `\n   - ${severity}: ${diagnostic.message}`;
      if (diagnostic.source) {
        result += ` (${diagnostic.source})`;
      }
    });
  }
  if (action.edit?.changes) {
    result += '\n   📄 File changes:';
    Object.entries(action.edit.changes).forEach(([uri, edits]) => {
      result += `\n   - ${uri}: ${edits.length} edit(s)`;
    });
  }
  if (action.command) {
    result += `\n   ⚡ Command: ${action.command.title} (${action.command.command})`;
  }
  return result;
}

function formatCommand(command: Command, index: number): string {
  // Create clean object for executeCodeAction tool (remove undefined fields)
  const cleanCommand: Partial<Command> = {
    title: command.title,
    command: command.command,
  };
  if (command.arguments) cleanCommand.arguments = command.arguments;

  const commandJson = JSON.stringify(cleanCommand, null, 2);

  let result = `\n${index}. ${command.title}`;
  result += `\n   📋 For executeCodeAction tool:\n${commandJson}`;
  result += `\n   ⚡ Command: ${command.command}`;
  if (command.arguments && command.arguments.length > 0) {
    result += `\n   📝 Arguments: ${command.arguments.length} argument(s)`;
  }
  return result;
}

function getSeverityString(severity?: number): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'Error';
    case DiagnosticSeverity.Warning:
      return 'Warning';
    case DiagnosticSeverity.Information:
      return 'Info';
    case DiagnosticSeverity.Hint:
      return 'Hint';
    default:
      return 'Unknown';
  }
}

function codeActionNothingContent(): CallToolResult {
  return {
    content: [{
      type: 'text',
      text: 'No code actions available.',
    }],
  };
}
