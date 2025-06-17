import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolCallees } from './MCPToolCallees';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CallHierarchyItem, CallHierarchyOutgoingCall, SymbolKind } from '../lsp/types/CallHierarchyRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolCallees', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolCallees: MCPToolCallees;
  let outgoingCallsSpy: jest.MockedFunction<LSPServerEx['outgoingCalls']>;
  let prepareCallHierarchySpy: jest.MockedFunction<LSPServerEx['prepareCallHierarchy']>;

  const mockCallHierarchyItem: CallHierarchyItem = {
    name: 'testFunction',
    kind: SymbolKind.Function,
    uri: 'file:///test.ts',
    range: {
      start: { line: 5, character: 0 },
      end: { line: 10, character: 0 },
    },
    selectionRange: {
      start: { line: 5, character: 9 },
      end: { line: 5, character: 21 },
    },
  };

  beforeEach(() => {
    outgoingCallsSpy = jest.fn();
    prepareCallHierarchySpy = jest.fn();
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
      prepareCallHierarchy: prepareCallHierarchySpy,
      incomingCalls: jest.fn(),
      outgoingCalls: outgoingCallsSpy,
      codeAction: jest.fn(),
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolCallees = new MCPToolCallees(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolCallees.listItem();

      expect(tool.name).toBe('callees');
      expect(tool.description).toBe('Find all functions/methods that a specific function calls');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('uri');
      expect(tool.inputSchema.properties).toHaveProperty('line');
      expect(tool.inputSchema.properties).toHaveProperty('character');
      expect(tool.inputSchema.required).toEqual(['uri', 'line', 'character']);
    });
  });

  describe('handle', () => {
    it('should successfully get callees for valid parameters', async () => {
      const mockOutgoingCalls: CallHierarchyOutgoingCall[] = [
        {
          to: {
            name: 'calledFunction',
            kind: SymbolKind.Function,
            uri: 'file:///called.ts',
            range: {
              start: { line: 25, character: 0 },
              end: { line: 30, character: 0 },
            },
            selectionRange: {
              start: { line: 25, character: 9 },
              end: { line: 25, character: 23 },
            },
          },
          fromRanges: [
            {
              start: { line: 7, character: 4 },
              end: { line: 7, character: 18 },
            },
          ],
        },
      ];

      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      outgoingCallsSpy.mockResolvedValue(mockOutgoingCalls);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallees.handle(params);

      expect(prepareCallHierarchySpy).toHaveBeenCalledWith({ textDocument: { uri: 'file:///test.ts' }, position: { line: 5, character: 9 } });
      expect(outgoingCallsSpy).toHaveBeenCalledWith({ item: mockCallHierarchyItem });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Found 1 callees:\n/called.ts:25:9',
      });
    });

    it('should handle null response', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      outgoingCallsSpy.mockResolvedValue(null);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallees.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No callees found for symbol at /test.ts:5:9',
      });
    });

    it('should handle empty array response', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      outgoingCallsSpy.mockResolvedValue([]);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallees.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No callees found for symbol at /test.ts:5:9',
      });
    });

    it('should handle when prepareCallHierarchy returns empty results', async () => {
      prepareCallHierarchySpy.mockResolvedValue([]);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallees.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No callees found for symbol at /test.ts:5:9',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 123,  // invalid type
        line: 'invalid',
        character: 9,
      };

      await expect(mcpToolCallees.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      outgoingCallsSpy.mockRejectedValue(new Error('LSP error'));

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      await expect(mcpToolCallees.handle(params)).rejects.toThrow(McpError);
    });
  });
});
