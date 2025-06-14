import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolOutgoingCalls } from './MCPToolOutgoingCalls';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CallHierarchyItem, CallHierarchyOutgoingCall, SymbolKind } from '../lsp/types/CallHierarchyRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolOutgoingCalls', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolOutgoingCalls: MCPToolOutgoingCalls;
  let outgoingCallsSpy: jest.MockedFunction<LSPServerEx['outgoingCalls']>;

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
      applyEdit: jest.fn(),
      prepareCallHierarchy: jest.fn(),
      incomingCalls: jest.fn(),
      outgoingCalls: outgoingCallsSpy,
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolOutgoingCalls = new MCPToolOutgoingCalls(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolOutgoingCalls.listItem();

      expect(tool.name).toBe('outgoingCalls');
      expect(tool.description).toBe('Find all functions/methods that a specific function calls');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('item');
      expect(tool.inputSchema.required).toEqual(['item']);
    });
  });

  describe('handle', () => {
    it('should successfully get outgoing calls for valid parameters', async () => {
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

      outgoingCallsSpy.mockResolvedValue(mockOutgoingCalls);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolOutgoingCalls.handle(params);

      expect(outgoingCallsSpy).toHaveBeenCalledWith({ item: mockCallHierarchyItem });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify(mockOutgoingCalls, null, 2),
      });
    });

    it('should handle null response', async () => {
      outgoingCallsSpy.mockResolvedValue(null);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolOutgoingCalls.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No outgoing calls available for this item.',
      });
    });

    it('should handle empty array response', async () => {
      outgoingCallsSpy.mockResolvedValue([]);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolOutgoingCalls.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No outgoing calls found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        item: { invalid: 'item' },
      };

      await expect(mcpToolOutgoingCalls.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      outgoingCallsSpy.mockRejectedValue(new Error('LSP error'));

      const params = {
        item: mockCallHierarchyItem,
      };

      await expect(mcpToolOutgoingCalls.handle(params)).rejects.toThrow(McpError);
    });
  });
});
