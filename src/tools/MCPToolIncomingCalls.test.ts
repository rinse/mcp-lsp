import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolIncomingCalls } from './MCPToolIncomingCalls';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CallHierarchyItem, CallHierarchyIncomingCall, SymbolKind } from '../lsp/types/CallHierarchyRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolIncomingCalls', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolIncomingCalls: MCPToolIncomingCalls;
  let incomingCallsSpy: jest.MockedFunction<LSPServerEx['incomingCalls']>;

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
    incomingCallsSpy = jest.fn();
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
      incomingCalls: incomingCallsSpy,
      outgoingCalls: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolIncomingCalls = new MCPToolIncomingCalls(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolIncomingCalls.listItem();

      expect(tool.name).toBe('incomingCalls');
      expect(tool.description).toBe('Find all locations that call a specific function/method');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('item');
      expect(tool.inputSchema.required).toEqual(['item']);
    });
  });

  describe('handle', () => {
    it('should successfully get incoming calls for valid parameters', async () => {
      const mockIncomingCalls: CallHierarchyIncomingCall[] = [
        {
          from: {
            name: 'callerFunction',
            kind: SymbolKind.Function,
            uri: 'file:///caller.ts',
            range: {
              start: { line: 15, character: 0 },
              end: { line: 20, character: 0 },
            },
            selectionRange: {
              start: { line: 15, character: 9 },
              end: { line: 15, character: 23 },
            },
          },
          fromRanges: [
            {
              start: { line: 17, character: 4 },
              end: { line: 17, character: 16 },
            },
          ],
        },
      ];

      incomingCallsSpy.mockResolvedValue(mockIncomingCalls);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolIncomingCalls.handle(params);

      expect(incomingCallsSpy).toHaveBeenCalledWith({ item: mockCallHierarchyItem });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify(mockIncomingCalls, null, 2),
      });
    });

    it('should handle null response', async () => {
      incomingCallsSpy.mockResolvedValue(null);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolIncomingCalls.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No incoming calls available for this item.',
      });
    });

    it('should handle empty array response', async () => {
      incomingCallsSpy.mockResolvedValue([]);

      const params = {
        item: mockCallHierarchyItem,
      };

      const result = await mcpToolIncomingCalls.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No incoming calls found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        item: { invalid: 'item' },
      };

      await expect(mcpToolIncomingCalls.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      incomingCallsSpy.mockRejectedValue(new Error('LSP error'));

      const params = {
        item: mockCallHierarchyItem,
      };

      await expect(mcpToolIncomingCalls.handle(params)).rejects.toThrow(McpError);
    });
  });
});
