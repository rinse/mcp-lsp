import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolRename } from './MCPToolRename';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { ApplyWorkspaceEditResult } from '../lsp/types/ApplyWorkspaceEditParams';
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

describe('MCPToolRename', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolRename: MCPToolRename;
  let renameSpy: jest.MockedFunction<LSPServerEx['rename']>;
  let mockApplyWorkspaceEdit: jest.Mock;

  beforeEach(() => {
    renameSpy = jest.fn();
    mockApplyWorkspaceEdit = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      rename: renameSpy,
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    // Access the WorkspaceEditApplier instance and mock its method
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    (lspManager as any).workspaceEditApplier.applyWorkspaceEdit = mockApplyWorkspaceEdit;
    mcpToolRename = new MCPToolRename(lspManager);
  });

  describe('handle', () => {
    const validParams = {
      uri: 'file:///test/file.ts',
      line: 10,
      character: 5,
      newName: 'newSymbolName',
    };

    it('should handle successful rename with workspace edit', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              newText: 'newSymbolName',
            },
          ],
        },
      };
      const applyResult: ApplyWorkspaceEditResult = {
        applied: true,
      };
      renameSpy.mockResolvedValue(workspaceEdit);
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      const result = await mcpToolRename.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Successfully renamed symbol to "newSymbolName"',
        }],
      });
      expect(renameSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        position: { line: validParams.line, character: validParams.character },
        newName: validParams.newName,
      });
      expect(mockApplyWorkspaceEdit).toHaveBeenCalledWith(workspaceEdit);
    });

    it('should handle rename returning null', async () => {
      const applyResult: ApplyWorkspaceEditResult = {
        applied: true,
      };
      renameSpy.mockResolvedValue(null);
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      const result = await mcpToolRename.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Successfully renamed symbol to "newSymbolName"',
        }],
      });
      expect(mockApplyWorkspaceEdit).toHaveBeenCalledWith({});
    });

    it('should handle failed applyEdit', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file.ts': [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              newText: 'newSymbolName',
            },
          ],
        },
      };
      const applyResult: ApplyWorkspaceEditResult = {
        applied: false,
        failureReason: 'File is read-only',
      };
      renameSpy.mockResolvedValue(workspaceEdit);
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      const result = await mcpToolRename.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Failed to apply rename: File is read-only',
        }],
      });
    });

    it('should handle failed applyEdit without failure reason', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {},
      };
      const applyResult: ApplyWorkspaceEditResult = {
        applied: false,
      };
      renameSpy.mockResolvedValue(workspaceEdit);
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      const result = await mcpToolRename.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Failed to apply rename: Unknown error',
        }],
      });
    });

    it('should throw error for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test/file.ts',
        line: 'not a number', // Invalid type
        character: 5,
        newName: 'newSymbolName',
      };
      await expect(mcpToolRename.handle(invalidParams)).rejects.toThrow(McpError);
      await expect(mcpToolRename.handle(invalidParams)).rejects.toThrow('Invalid parameters for rename tool');
    });

    it('should throw error when missing required parameters', async () => {
      const missingParams = {
        uri: 'file:///test/file.ts',
        line: 10,
        character: 5,
        // Missing newName
      };
      await expect(mcpToolRename.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolRename.handle(missingParams)).rejects.toThrow('Invalid parameters for rename tool');
    });

    it('should handle errors from LSP server during rename', async () => {
      const serverError = new Error('LSP server rename error');
      mockLSPServerEx.rename.mockRejectedValue(serverError);
      await expect(mcpToolRename.handle(validParams)).rejects.toThrow(McpError);
      await expect(mcpToolRename.handle(validParams)).rejects.toThrow('Failed to rename symbol: Error: LSP server rename error');
    });

    it('should handle errors from LSP server during applyEdit', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {},
      };
      renameSpy.mockResolvedValue(workspaceEdit);
      mockApplyWorkspaceEdit.mockRejectedValue(new Error('Apply edit error'));
      await expect(mcpToolRename.handle(validParams)).rejects.toThrow(McpError);
      await expect(mcpToolRename.handle(validParams)).rejects.toThrow('Failed to rename symbol: Error: Apply edit error');
    });

    it('should handle complex workspace edit with multiple files', async () => {
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test/file1.ts': [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              newText: 'newSymbolName',
            },
          ],
          'file:///test/file2.ts': [
            {
              range: {
                start: { line: 20, character: 10 },
                end: { line: 20, character: 20 },
              },
              newText: 'newSymbolName',
            },
            {
              range: {
                start: { line: 30, character: 0 },
                end: { line: 30, character: 10 },
              },
              newText: 'newSymbolName',
            },
          ],
        },
      };
      const applyResult: ApplyWorkspaceEditResult = {
        applied: true,
      };
      renameSpy.mockResolvedValue(workspaceEdit);
      mockApplyWorkspaceEdit.mockResolvedValue(applyResult);
      const result = await mcpToolRename.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'Successfully renamed symbol to "newSymbolName"',
        }],
      });
      expect(mockApplyWorkspaceEdit).toHaveBeenCalledWith(workspaceEdit);
    });
  });
});
