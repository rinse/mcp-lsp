import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolCallHierarchy } from './MCPToolCallHierarchy';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CallHierarchyItem, CallHierarchyIncomingCall, SymbolKind } from '../lsp/types/CallHierarchyRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolCallHierarchy', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolCallHierarchy: MCPToolCallHierarchy;
  let incomingCallsSpy: jest.MockedFunction<LSPServerEx['incomingCalls']>;
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
    incomingCallsSpy = jest.fn();
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
      incomingCalls: incomingCallsSpy,
      outgoingCalls: jest.fn(),
      codeAction: jest.fn(),
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolCallHierarchy = new MCPToolCallHierarchy(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolCallHierarchy.listItem();

      expect(tool.name).toBe('callHierarchy');
      expect(tool.description).toBe('Find all locations that call a specific function/method');
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toHaveProperty('uri');
      expect(tool.inputSchema.properties).toHaveProperty('line');
      expect(tool.inputSchema.properties).toHaveProperty('character');
      expect(tool.inputSchema.required).toEqual(['uri', 'line', 'character']);
    });
  });

  describe('handle', () => {
    it('should successfully get call hierarchy for valid parameters', async () => {
      const mockCallHierarchy: CallHierarchyIncomingCall[] = [
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

      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      incomingCallsSpy.mockResolvedValue(mockCallHierarchy);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallHierarchy.handle(params);

      expect(prepareCallHierarchySpy).toHaveBeenCalledWith({ textDocument: { uri: 'file:///test.ts' }, position: { line: 5, character: 9 } });
      expect(incomingCallsSpy).toHaveBeenCalledWith({ item: mockCallHierarchyItem });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify(mockCallHierarchy, null, 2),
      });
    });

    it('should handle null response', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      incomingCallsSpy.mockResolvedValue(null);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallHierarchy.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No incoming calls available for this item.',
      });
    });

    it('should handle empty array response', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      incomingCallsSpy.mockResolvedValue([]);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallHierarchy.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No incoming calls found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 123,  // invalid type
        line: 'invalid',
        character: 9,
      };

      await expect(mcpToolCallHierarchy.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should handle when prepareCallHierarchy returns empty results', async () => {
      prepareCallHierarchySpy.mockResolvedValue([]);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      const result = await mcpToolCallHierarchy.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No incoming calls available for this item.',
      });
    });

    it('should throw McpError when LSP request fails', async () => {
      prepareCallHierarchySpy.mockResolvedValue([mockCallHierarchyItem]);
      incomingCallsSpy.mockRejectedValue(new Error('LSP error'));

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 9,
      };

      await expect(mcpToolCallHierarchy.handle(params)).rejects.toThrow(McpError);
    });
  });
});
