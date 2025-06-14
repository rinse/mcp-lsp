import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolExecuteCodeAction } from './MCPToolExecuteCodeAction';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { ApplyWorkspaceEditResult } from '../lsp/types/ApplyWorkspaceEditParams';
import { CodeAction, CodeActionKind, Command } from '../lsp/types/CodeActionRequest';
import { ExecuteCommandResult } from '../lsp/types/ExecuteCommandRequest';
import { WorkspaceEdit } from '../lsp/types/WorkspaceEdit';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

// Mock WorkspaceEditApplier
jest.mock('../lsp/WorkspaceEditApplier', () => ({
  WorkspaceEditApplier: jest.fn().mockImplementation(() => ({
    applyWorkspaceEdit: jest.fn(),
  })),
}));

describe('MCPToolExecuteCodeAction', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolExecuteCodeAction: MCPToolExecuteCodeAction;
  let executeCommandSpy: jest.MockedFunction<LSPServerEx['executeCommand']>;
  let mockApplyWorkspaceEdit: jest.Mock;

  beforeEach(() => {
    executeCommandSpy = jest.fn();
    mockApplyWorkspaceEdit = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      definition: jest.fn(),
      implementation: jest.fn(),
      references: jest.fn(),
      typeDefinition: jest.fn(),
      rename: jest.fn(),
      codeAction: jest.fn(),
      executeCommand: executeCommandSpy,
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    // Access the WorkspaceEditApplier instance and mock its method
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (lspManager as any).workspaceEditApplier.applyWorkspaceEdit = mockApplyWorkspaceEdit;
    mcpToolExecuteCodeAction = new MCPToolExecuteCodeAction(lspManager);
  });

  describe('handle', () => {
    it('should execute code action with WorkspaceEdit successfully', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
              },
              newText: 'const',
            },
          ],
        },
      };

      const codeAction: CodeAction = {
        title: 'Convert to const',
        kind: CodeActionKind.QuickFix,
        edit: workspaceEdit,
      };

      const applyResult: ApplyWorkspaceEditResult = {
        applied: true,
      };

      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '✅ Successfully applied WorkspaceEdit for "Convert to const"',
          },
        ],
      });

      expect(mockApplyWorkspaceEdit).toHaveBeenCalledWith(workspaceEdit);
    });

    it('should execute code action with Command successfully', async () => {
      const command: Command = {
        title: 'Organize imports',
        command: 'typescript.organizeImports',
        arguments: [{ uri: 'file:///test/file.ts' }],
      };

      const codeAction: CodeAction = {
        title: 'Organize imports',
        kind: CodeActionKind.SourceOrganizeImports,
        command,
      };

      const commandResult: ExecuteCommandResult = { success: true };
      executeCommandSpy.mockResolvedValue(commandResult);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '✅ Successfully executed command "typescript.organizeImports" for "Organize imports"',
          },
          {
            type: 'text',
            text: 'Command result: {\n  "success": true\n}',
          },
        ],
      });

      expect(executeCommandSpy).toHaveBeenCalledWith({
        command: 'typescript.organizeImports',
        arguments: [{ uri: 'file:///test/file.ts' }],
      });
    });

    it('should execute code action with both WorkspaceEdit and Command', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
              },
              newText: 'const',
            },
          ],
        },
      };

      const command: Command = {
        title: 'Format document',
        command: 'typescript.format',
      };

      const codeAction: CodeAction = {
        title: 'Fix and format',
        edit: workspaceEdit,
        command,
      };

      const applyResult: ApplyWorkspaceEditResult = { applied: true };
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      executeCommandSpy.mockResolvedValue(null);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '✅ Successfully applied WorkspaceEdit for "Fix and format"',
          },
          {
            type: 'text',
            text: '✅ Successfully executed command "typescript.format" for "Fix and format"',
          },
        ],
      });

      expect(mockApplyWorkspaceEdit).toHaveBeenCalledWith(workspaceEdit);
      expect(executeCommandSpy).toHaveBeenCalledWith({
        command: 'typescript.format',
        arguments: undefined,
      });
    });

    it('should handle WorkspaceEdit application failure', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
              },
              newText: 'const',
            },
          ],
        },
      };

      const codeAction: CodeAction = {
        title: 'Convert to const',
        edit: workspaceEdit,
      };

      const applyResult: ApplyWorkspaceEditResult = {
        applied: false,
        failureReason: 'File not found',
      };

      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Failed to apply WorkspaceEdit: File not found',
          },
        ],
      });
    });

    it('should handle Command execution failure', async () => {
      const command: Command = {
        title: 'Unknown command',
        command: 'unknown.command',
      };

      const codeAction: CodeAction = {
        title: 'Unknown action',
        command,
      };

      const error = new Error('Command not found');
      executeCommandSpy.mockRejectedValue(error);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Error executing command "unknown.command": Error: Command not found',
          },
        ],
      });
    });

    it('should handle code action with no WorkspaceEdit or Command', async () => {
      const codeAction: CodeAction = {
        title: 'Empty action',
        kind: CodeActionKind.Refactor,
      };

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '⚠️ Code action "Empty action" has no WorkspaceEdit or Command to execute',
          },
        ],
      });
    });

    it('should handle invalid WorkspaceEdit format', async () => {
      const codeAction: CodeAction = {
        title: 'Invalid edit',
        edit: { invalid: 'format' } as unknown as WorkspaceEdit, // Invalid WorkspaceEdit
      };

      // Mock the method to return a failure for invalid format
      mockApplyWorkspaceEdit.mockResolvedValue({
        applied: false,
        failureReason: 'Invalid WorkspaceEdit format',
      });

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Failed to apply WorkspaceEdit: Invalid WorkspaceEdit format',
          },
        ],
      });
    });

    it('should handle WorkspaceEdit application error', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 5 },
              },
              newText: 'const',
            },
          ],
        },
      };

      const codeAction: CodeAction = {
        title: 'Convert to const',
        edit: workspaceEdit,
      };

      const error = new Error('Disk full');
      mockApplyWorkspaceEdit.mockRejectedValue(error);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '❌ Error applying WorkspaceEdit: Error: Disk full',
          },
        ],
      });
    });

    it('should throw error for invalid parameters', async () => {
      const invalidParams = {
        invalidParam: 'value',
      };

      await expect(mcpToolExecuteCodeAction.handle(invalidParams)).rejects.toThrow(McpError);
      await expect(mcpToolExecuteCodeAction.handle(invalidParams)).rejects.toThrow('Invalid parameters for executeCodeAction tool');
    });

    it('should throw error when missing required codeAction parameter', async () => {
      const missingParams = {};

      await expect(mcpToolExecuteCodeAction.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolExecuteCodeAction.handle(missingParams)).rejects.toThrow('Invalid parameters for executeCodeAction tool');
    });

    it('should handle Command with null result', async () => {
      const command: Command = {
        title: 'Silent command',
        command: 'typescript.silent',
      };

      const codeAction: CodeAction = {
        title: 'Silent action',
        command,
      };

      executeCommandSpy.mockResolvedValue(null);

      const result = await mcpToolExecuteCodeAction.handle({ codeAction });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '✅ Successfully executed command "typescript.silent" for "Silent action"',
          },
        ],
      });
    });
  });

  describe('listItem', () => {
    it('should return correct tool definition', () => {
      const toolDefinition = mcpToolExecuteCodeAction.listItem();

      expect(toolDefinition.name).toBe('executeCodeAction');
      expect(toolDefinition.description).toContain('Execute a code action');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('codeAction');
      expect(toolDefinition.inputSchema.required).toEqual(['codeAction']);
    });
  });
});
