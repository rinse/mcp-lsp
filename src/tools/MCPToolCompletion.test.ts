import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolCompletion } from './MCPToolCompletion';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import {
  CompletionItem,
  CompletionList,
  CompletionItemKind,
  CompletionTriggerKind,
} from '../lsp/types/CompletionRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolCompletion', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolCompletion: MCPToolCompletion;
  let completionSpy: jest.MockedFunction<LSPServerEx['completion']>;

  beforeEach(() => {
    completionSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      completion: completionSpy,
      definition: jest.fn(),
      implementation: jest.fn(),
      references: jest.fn(),
      typeDefinition: jest.fn(),
      rename: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolCompletion = new MCPToolCompletion(lspManager);
  });

  describe('listItem', () => {
    it('should return correct tool description', () => {
      const toolDescription = mcpToolCompletion.listItem();
      expect(toolDescription).toEqual({
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
      });
    });
  });

  describe('handle', () => {
    const validParams = {
      uri: 'file:///test/file.ts',
      line: 10,
      character: 5,
    };

    it('should handle completion with array result', async () => {
      const completionItems: CompletionItem[] = [
        {
          label: 'myVariable',
          kind: CompletionItemKind.Variable,
          detail: 'string',
          documentation: 'A test variable',
          insertText: 'myVariable',
        },
        {
          label: 'myFunction',
          kind: CompletionItemKind.Function,
          detail: '(): void',
          documentation: 'A test function',
        },
      ];
      completionSpy.mockResolvedValue(completionItems);
      const result = await mcpToolCompletion.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify([
            {
              label: 'myVariable',
              kind: 'Variable',
              detail: 'string',
              documentation: 'A test variable',
              insertText: 'myVariable',
              sortText: undefined,
              filterText: undefined,
            },
            {
              label: 'myFunction',
              kind: 'Function',
              detail: '(): void',
              documentation: 'A test function',
              insertText: 'myFunction',
              sortText: undefined,
              filterText: undefined,
            },
          ], null, 2),
        }],
      });
      expect(completionSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        position: { line: validParams.line, character: validParams.character },
        context: undefined,
      });
    });

    it('should handle completion with CompletionList result', async () => {
      const completionList: CompletionList = {
        isIncomplete: true,
        items: [
          {
            label: 'partialResult',
            kind: CompletionItemKind.Text,
            detail: 'partial completion',
          },
        ],
      };
      completionSpy.mockResolvedValue(completionList);
      const result = await mcpToolCompletion.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            isIncomplete: true,
            items: [
              {
                label: 'partialResult',
                kind: 'Text',
                detail: 'partial completion',
                documentation: undefined,
                insertText: 'partialResult',
                sortText: undefined,
                filterText: undefined,
              },
            ],
          }, null, 2),
        }],
      });
    });

    it('should handle completion with null result', async () => {
      completionSpy.mockResolvedValue(null);
      const result = await mcpToolCompletion.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'No completions available.',
        }],
      });
    });

    it('should handle completion with trigger context', async () => {
      const paramsWithTrigger = {
        ...validParams,
        triggerKind: CompletionTriggerKind.TriggerCharacter,
        triggerCharacter: '.',
      };
      const completionItems: CompletionItem[] = [
        {
          label: 'property',
          kind: CompletionItemKind.Property,
        },
      ];
      completionSpy.mockResolvedValue(completionItems);
      await mcpToolCompletion.handle(paramsWithTrigger);
      expect(completionSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        position: { line: validParams.line, character: validParams.character },
        context: {
          triggerKind: CompletionTriggerKind.TriggerCharacter,
          triggerCharacter: '.',
        },
      });
    });

    it('should handle completion with all completion item kinds', async () => {
      const completionItems: CompletionItem[] = [
        { label: 'text', kind: CompletionItemKind.Text },
        { label: 'method', kind: CompletionItemKind.Method },
        { label: 'function', kind: CompletionItemKind.Function },
        { label: 'constructor', kind: CompletionItemKind.Constructor },
        { label: 'field', kind: CompletionItemKind.Field },
        { label: 'variable', kind: CompletionItemKind.Variable },
        { label: 'class', kind: CompletionItemKind.Class },
        { label: 'interface', kind: CompletionItemKind.Interface },
        { label: 'module', kind: CompletionItemKind.Module },
        { label: 'property', kind: CompletionItemKind.Property },
        { label: 'unit', kind: CompletionItemKind.Unit },
        { label: 'value', kind: CompletionItemKind.Value },
        { label: 'enum', kind: CompletionItemKind.Enum },
        { label: 'keyword', kind: CompletionItemKind.Keyword },
        { label: 'snippet', kind: CompletionItemKind.Snippet },
        { label: 'color', kind: CompletionItemKind.Color },
        { label: 'file', kind: CompletionItemKind.File },
        { label: 'reference', kind: CompletionItemKind.Reference },
        { label: 'folder', kind: CompletionItemKind.Folder },
        { label: 'enumMember', kind: CompletionItemKind.EnumMember },
        { label: 'constant', kind: CompletionItemKind.Constant },
        { label: 'struct', kind: CompletionItemKind.Struct },
        { label: 'event', kind: CompletionItemKind.Event },
        { label: 'operator', kind: CompletionItemKind.Operator },
        { label: 'typeParameter', kind: CompletionItemKind.TypeParameter },
      ];
      completionSpy.mockResolvedValue(completionItems);
      const result = await mcpToolCompletion.handle(validParams);
      const content = result.content[0];
      if (content.type === 'text') {
        const parsedResult = JSON.parse(content.text) as unknown[];
        expect(parsedResult).toHaveLength(25);
        expect((parsedResult[0] as { kind: string }).kind).toBe('Text');
        expect((parsedResult[1] as { kind: string }).kind).toBe('Method');
        expect((parsedResult[24] as { kind: string }).kind).toBe('TypeParameter');
      }
    });

    it('should handle completion items with all optional fields', async () => {
      const completionItem: CompletionItem = {
        label: 'complexItem',
        kind: CompletionItemKind.Variable,
        detail: 'complex variable type',
        documentation: 'This is a complex variable with all fields',
        deprecated: false,
        preselect: true,
        sortText: '0001',
        filterText: 'complex',
        insertText: 'complexItem.value',
      };
      completionSpy.mockResolvedValue([completionItem]);
      const result = await mcpToolCompletion.handle(validParams);
      const content = result.content[0];
      if (content.type === 'text') {
        const parsedResult = JSON.parse(content.text) as unknown[];
        expect(parsedResult[0]).toEqual({
          label: 'complexItem',
          kind: 'Variable',
          detail: 'complex variable type',
          documentation: 'This is a complex variable with all fields',
          insertText: 'complexItem.value',
          sortText: '0001',
          filterText: 'complex',
        });
      }
    });

    it('should throw error for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test/file.ts',
        line: 'not a number', // Invalid type
        character: 5,
      };
      await expect(mcpToolCompletion.handle(invalidParams)).rejects.toThrow(McpError);
      await expect(mcpToolCompletion.handle(invalidParams)).rejects.toThrow('Invalid parameters for completion tool');
    });

    it('should throw error when missing required parameters', async () => {
      const missingParams = {
        uri: 'file:///test/file.ts',
        // Missing line and character
      };
      await expect(mcpToolCompletion.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolCompletion.handle(missingParams)).rejects.toThrow('Invalid parameters for completion tool');
    });

    it('should handle errors from LSP server', async () => {
      const serverError = new Error('LSP server error');
      completionSpy.mockRejectedValue(serverError);
      await expect(mcpToolCompletion.handle(validParams)).rejects.toThrow(McpError);
      await expect(mcpToolCompletion.handle(validParams)).rejects.toThrow('Failed to get completion information: Error: LSP server error');
    });

    it('should handle invalid trigger kind', async () => {
      const invalidTriggerParams = {
        ...validParams,
        triggerKind: 99, // Invalid trigger kind
      };
      await expect(mcpToolCompletion.handle(invalidTriggerParams)).rejects.toThrow(McpError);
      await expect(mcpToolCompletion.handle(invalidTriggerParams)).rejects.toThrow('Invalid parameters for completion tool');
    });

    it('should handle trigger character without trigger kind', async () => {
      const triggerCharOnlyParams = {
        ...validParams,
        triggerCharacter: '.',
        // Missing triggerKind
      };
      completionSpy.mockResolvedValue([]);
      await mcpToolCompletion.handle(triggerCharOnlyParams);
      expect(completionSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        position: { line: validParams.line, character: validParams.character },
        context: undefined, // Should be undefined since triggerKind is not provided
      });
    });

    it('should handle empty completion results', async () => {
      completionSpy.mockResolvedValue([]);
      const result = await mcpToolCompletion.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify([], null, 2),
        }],
      });
    });

    it('should handle completion items without kind', async () => {
      const completionItem: CompletionItem = {
        label: 'noKindItem',
        // kind is undefined
      };
      completionSpy.mockResolvedValue([completionItem]);
      const result = await mcpToolCompletion.handle(validParams);
      const content = result.content[0];
      if (content.type === 'text') {
        const parsedResult = JSON.parse(content.text) as unknown[];
        expect(parsedResult[0]).toEqual({
          label: 'noKindItem',
          kind: undefined,
          detail: undefined,
          documentation: undefined,
          insertText: 'noKindItem', // Should default to label
          sortText: undefined,
          filterText: undefined,
        });
      }
    });
  });
});
