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
import { WorkspaceEdit, WorkspaceEditT } from "../lsp/types/WorkspaceEdit";

export class MCPToolExecuteCodeAction implements MCPTool {
  constructor(private manager: LSPManager) {}

  listItem(): Tool {
    return listItemExecuteCodeAction();
  }

  async handle(params: CallToolRequest["params"]["arguments"]): Promise<CallToolResult> {
    return handleExecuteCodeAction(this.manager, params);
  }
}

function listItemExecuteCodeAction(): Tool {
  return {
    name: 'run_code_action',
    description: 'Execute a code action by applying its WorkspaceEdit or running its Command',
    inputSchema: {
      type: 'object',
      properties: {
        codeAction: {
          type: 'object',
          description: 'The CodeAction object to execute (from codeAction tool results)',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the code action',
            },
            kind: {
              type: 'string',
              description: 'Kind of code action (optional)',
            },
            edit: {
              type: 'object',
              description: 'WorkspaceEdit to apply (optional)',
            },
            command: {
              type: 'object',
              description: 'Command to execute (optional)',
              properties: {
                title: { type: 'string' },
                command: { type: 'string' },
                arguments: { type: 'array' },
              },
              required: ['title', 'command'],
            },
          },
          required: ['title'],
        },
      },
      required: ['codeAction'],
    },
  };
}

const ExecuteCodeActionParamsT = t.type({
  codeAction: t.intersection([
    t.type({
      title: t.string,
    }),
    t.partial({
      kind: t.string,
      edit: t.object,
      command: t.intersection([
        t.type({
          title: t.string,
          command: t.string,
        }),
        t.partial({
          arguments: t.array(t.any),
        }),
      ]),
    }),
  ]),
});

async function handleExecuteCodeAction(
  manager: LSPManager,
  params: CallToolRequest["params"]["arguments"],
): Promise<CallToolResult> {
  const decoded = ExecuteCodeActionParamsT.decode(params);
  if (decoded._tag === 'Left') {
    throw new McpError(ErrorCode.InvalidParams, `Invalid parameters for run_code_action tool: ${JSON.stringify(decoded.left)}`);
  }
  const { codeAction } = decoded.right;
  try {
    const results: TextContent[] = [];
    let hasExecuted = false;

    // First, try to apply WorkspaceEdit if present
    if (codeAction.edit) {
      try {
        if (WorkspaceEditT.is(codeAction.edit)) {
          const applyResult = await manager.applyEdit({
            label: `Execute code action: ${codeAction.title}`,
            edit: codeAction.edit as WorkspaceEdit,
          });

          if (applyResult.applied) {
            results.push({
              type: 'text',
              text: `✅ Successfully applied WorkspaceEdit for "${codeAction.title}"`,
            });
            hasExecuted = true;
          } else {
            results.push({
              type: 'text',
              text: `❌ Failed to apply WorkspaceEdit: ${applyResult.failureReason ?? 'Unknown error'}`,
            });
          }
        } else {
          results.push({
            type: 'text',
            text: `⚠️ Invalid WorkspaceEdit format in code action "${codeAction.title}"`,
          });
        }
      } catch (error) {
        results.push({
          type: 'text',
          text: `❌ Error applying WorkspaceEdit: ${String(error)}`,
        });
      }
    }

    // Then, try to execute Command if present
    if (codeAction.command) {
      try {
        const commandResult = await manager.executeCommand({
          command: codeAction.command.command,
          arguments: codeAction.command.arguments,
        });

        results.push({
          type: 'text',
          text: `✅ Successfully executed command "${codeAction.command.command}" for "${codeAction.title}"`,
        });

        if (commandResult !== null && commandResult !== undefined) {
          results.push({
            type: 'text',
            text: `Command result: ${JSON.stringify(commandResult, null, 2)}`,
          });
        }

        hasExecuted = true;
      } catch (error) {
        results.push({
          type: 'text',
          text: `❌ Error executing command "${codeAction.command.command}": ${String(error)}`,
        });
      }
    }

    if (!hasExecuted) {
      if (!codeAction.edit && !codeAction.command) {
        results.push({
          type: 'text',
          text: `⚠️ Code action "${codeAction.title}" has no WorkspaceEdit or Command to execute`,
        });
      }
    }

    return {
      content: results.length > 0 ? results : [{
        type: 'text',
        text: `No actions executed for "${codeAction.title}"`,
      }],
    };
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Failed to execute code action: ${String(error)}`);
  }
}
