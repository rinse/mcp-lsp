import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolCodeAction } from './MCPToolCodeAction';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CodeAction, CodeActionKind, CodeActionResult, Command, DiagnosticSeverity } from '../lsp/types/CodeActionRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolCodeAction', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolCodeAction: MCPToolCodeAction;
  let codeActionSpy: jest.MockedFunction<LSPServerEx['codeAction']>;

  beforeEach(() => {
    codeActionSpy = jest.fn();
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
      prepareCallHierarchy: jest.fn(),
      incomingCalls: jest.fn(),
      outgoingCalls: jest.fn(),
      codeAction: codeActionSpy,
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolCodeAction = new MCPToolCodeAction(lspManager);
  });

  describe('handle', () => {
    const validParams = {
      uri: 'file:///test/file.ts',
      line: 10,
      character: 5,
      endLine: 10,
      endCharacter: 15,
    };

    it('should handle code action with single quick fix', async () => {
      const codeActionResult: CodeActionResult = [
        {
          title: 'Fix missing semicolon',
          kind: CodeActionKind.QuickFix,
          edit: {
            changes: {
              'file:///test/file.ts': [
                {
                  range: {
                    start: { line: 10, character: 15 },
                    end: { line: 10, character: 15 },
                  },
                  newText: ';',
                },
              ],
            },
          },
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Fix missing semicolon (quickfix)\n   📋 For executeCodeAction tool:\n{\n  "title": "Fix missing semicolon",\n  "kind": "quickfix",\n  "edit": {\n    "changes": {\n      "file:///test/file.ts": [\n        {\n          "range": {\n            "start": {\n              "line": 10,\n              "character": 15\n            },\n            "end": {\n              "line": 10,\n              "character": 15\n            }\n          },\n          "newText": ";"\n        }\n      ]\n    }\n  }\n}\n   📄 File changes:\n   - file:///test/file.ts: 1 edit(s)',
          },
        ],
      });
      expect(codeActionSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        range: {
          start: { line: validParams.line, character: validParams.character },
          end: { line: validParams.endLine, character: validParams.endCharacter },
        },
        context: {
          diagnostics: [],
          only: undefined,
        },
      });
    });

    it('should handle code action with diagnostics', async () => {
      const paramsWithDiagnostics = {
        ...validParams,
        diagnostics: [
          {
            range: {
              start: { line: 10, character: 5 },
              end: { line: 10, character: 15 },
            },
            message: 'Missing semicolon',
            severity: DiagnosticSeverity.Error,
            source: 'typescript',
          },
        ],
      };
      const codeActionResult: CodeActionResult = [
        {
          title: 'Add missing semicolon',
          kind: CodeActionKind.QuickFix,
          diagnostics: [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              message: 'Missing semicolon',
              severity: DiagnosticSeverity.Error,
              source: 'typescript',
            },
          ],
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(paramsWithDiagnostics);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Add missing semicolon (quickfix)\n   📋 For executeCodeAction tool:\n{\n  "title": "Add missing semicolon",\n  "kind": "quickfix",\n  "diagnostics": [\n    {\n      "range": {\n        "start": {\n          "line": 10,\n          "character": 5\n        },\n        "end": {\n          "line": 10,\n          "character": 15\n        }\n      },\n      "message": "Missing semicolon",\n      "severity": 1,\n      "source": "typescript"\n    }\n  ]\n}\n   📝 Addresses diagnostics:\n   - Error: Missing semicolon (typescript)',
          },
        ],
      });
    });

    it('should handle code action with command', async () => {
      const codeActionResult: CodeActionResult = [
        {
          title: 'Organize imports',
          kind: CodeActionKind.SourceOrganizeImports,
          command: {
            title: 'Organize imports',
            command: 'typescript.organizeImports',
            arguments: [{ uri: 'file:///test/file.ts' }],
          },
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Organize imports (source.organizeImports)\n   📋 For executeCodeAction tool:\n{\n  "title": "Organize imports",\n  "kind": "source.organizeImports",\n  "command": {\n    "title": "Organize imports",\n    "command": "typescript.organizeImports",\n    "arguments": [\n      {\n        "uri": "file:///test/file.ts"\n      }\n    ]\n  }\n}\n   ⚡ Command: Organize imports (typescript.organizeImports)',
          },
        ],
      });
    });

    it('should handle preferred code action', async () => {
      const codeActionResult: CodeActionResult = [
        {
          title: 'Extract to function',
          kind: CodeActionKind.RefactorExtract,
          isPreferred: true,
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Extract to function (refactor.extract) [PREFERRED]\n   📋 For executeCodeAction tool:\n{\n  "title": "Extract to function",\n  "kind": "refactor.extract",\n  "isPreferred": true\n}',
          },
        ],
      });
    });

    it('should handle disabled code action', async () => {
      const codeActionResult: CodeActionResult = [
        {
          title: 'Refactor not available',
          kind: CodeActionKind.Refactor,
          disabled: {
            reason: 'No refactoring available for this selection',
          },
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Refactor not available (refactor) [DISABLED: No refactoring available for this selection]\n   📋 For executeCodeAction tool:\n{\n  "title": "Refactor not available",\n  "kind": "refactor",\n  "disabled": {\n    "reason": "No refactoring available for this selection"\n  }\n}',
          },
        ],
      });
    });

    it('should handle Command objects', async () => {
      const command: Command = {
        title: 'Run TypeScript compiler',
        command: 'typescript.build',
      };
      const codeActionResult: CodeActionResult = [command];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 1 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Run TypeScript compiler\n   📋 For executeCodeAction tool:\n{\n  "title": "Run TypeScript compiler",\n  "command": "typescript.build"\n}\n   ⚡ Command: typescript.build',
          },
        ],
      });
    });

    it('should handle multiple code actions', async () => {
      const codeActionResult: CodeActionResult = [
        {
          title: 'Quick fix 1',
          kind: CodeActionKind.QuickFix,
        } satisfies CodeAction,
        {
          title: 'Quick fix 2',
          kind: CodeActionKind.QuickFix,
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Found 2 code action(s):',
          },
          {
            type: 'text',
            text: '\n1. Quick fix 1 (quickfix)\n   📋 For executeCodeAction tool:\n{\n  "title": "Quick fix 1",\n  "kind": "quickfix"\n}',
          },
          {
            type: 'text',
            text: '\n2. Quick fix 2 (quickfix)\n   📋 For executeCodeAction tool:\n{\n  "title": "Quick fix 2",\n  "kind": "quickfix"\n}',
          },
        ],
      });
    });

    it('should handle code action returning null', async () => {
      codeActionSpy.mockResolvedValue(null);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'No code actions available.',
        }],
      });
    });

    it('should handle empty code action array', async () => {
      codeActionSpy.mockResolvedValue([]);
      const result = await mcpToolCodeAction.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'No code actions available.',
        }],
      });
    });

    it('should handle code action with only filter', async () => {
      const paramsWithOnly = {
        ...validParams,
        only: [CodeActionKind.QuickFix, CodeActionKind.Refactor],
      };
      const codeActionResult: CodeActionResult = [
        {
          title: 'Fix error',
          kind: CodeActionKind.QuickFix,
        } satisfies CodeAction,
      ];
      codeActionSpy.mockResolvedValue(codeActionResult);
      await mcpToolCodeAction.handle(paramsWithOnly);
      expect(codeActionSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        range: {
          start: { line: validParams.line, character: validParams.character },
          end: { line: validParams.endLine, character: validParams.endCharacter },
        },
        context: {
          diagnostics: [],
          only: [CodeActionKind.QuickFix, CodeActionKind.Refactor],
        },
      });
    });

    it('should throw error for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test/file.ts',
        line: 'not a number', // Invalid type
        character: 5,
        endLine: 10,
        endCharacter: 15,
      };
      await expect(mcpToolCodeAction.handle(invalidParams)).rejects.toThrow(McpError);
      await expect(mcpToolCodeAction.handle(invalidParams)).rejects.toThrow('Invalid parameters for list_code_actions tool');
    });

    it('should throw error when missing required parameters', async () => {
      const missingParams = {
        uri: 'file:///test/file.ts',
        line: 10,
        character: 5,
        // Missing endLine and endCharacter
      };
      await expect(mcpToolCodeAction.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolCodeAction.handle(missingParams)).rejects.toThrow('Invalid parameters for list_code_actions tool');
    });

    it('should handle errors from LSP server', async () => {
      const serverError = new Error('LSP server error');
      mockLSPServerEx.codeAction.mockRejectedValue(serverError);
      await expect(mcpToolCodeAction.handle(validParams)).rejects.toThrow(McpError);
      await expect(mcpToolCodeAction.handle(validParams)).rejects.toThrow('Failed to get code actions: Error: LSP server error');
    });
  });

  describe('listItem', () => {
    it('should return correct tool definition', () => {
      const toolDefinition = mcpToolCodeAction.listItem();
      expect(toolDefinition.name).toBe('list_code_actions');
      expect(toolDefinition.description).toContain('code actions');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('uri');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('line');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('character');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('endLine');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('endCharacter');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('diagnostics');
      expect(toolDefinition.inputSchema.properties).toHaveProperty('only');
      expect(toolDefinition.inputSchema.required).toEqual(['uri', 'line', 'character', 'endLine', 'endCharacter']);
    });
  });
});
