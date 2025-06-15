import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolPrepareCallHierarchy } from './MCPToolPrepareCallHierarchy';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { CallHierarchyItem, SymbolKind } from '../lsp/types/CallHierarchyRequest';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolPrepareCallHierarchy', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolPrepareCallHierarchy: MCPToolPrepareCallHierarchy;
  let prepareCallHierarchySpy: jest.MockedFunction<LSPServerEx['prepareCallHierarchy']>;

  beforeEach(() => {
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
      outgoingCalls: jest.fn(),
      codeAction: jest.fn(),
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolPrepareCallHierarchy = new MCPToolPrepareCallHierarchy(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolPrepareCallHierarchy.listItem();

      expect(tool.name).toBe('prepareCallHierarchy');
      expect(tool.description).toBe('Prepare call hierarchy information for a symbol at a specific position');
      expect(tool.inputSchema).toEqual({
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
        },
        required: ['uri', 'line', 'character'],
      });
    });
  });

  describe('handle', () => {
    it('should successfully prepare call hierarchy for valid parameters', async () => {
      const mockCallHierarchyItems: CallHierarchyItem[] = [
        {
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
        },
      ];

      prepareCallHierarchySpy.mockResolvedValue(mockCallHierarchyItems);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 15,
      };

      const result = await mcpToolPrepareCallHierarchy.handle(params);

      expect(prepareCallHierarchySpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 5, character: 15 },
      });

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: JSON.stringify(mockCallHierarchyItems, null, 2),
      });
    });

    it('should handle null response', async () => {
      prepareCallHierarchySpy.mockResolvedValue(null);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 15,
      };

      const result = await mcpToolPrepareCallHierarchy.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No call hierarchy available at this position.',
      });
    });

    it('should handle empty array response', async () => {
      prepareCallHierarchySpy.mockResolvedValue([]);

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 15,
      };

      const result = await mcpToolPrepareCallHierarchy.handle(params);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No call hierarchy items found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test.ts',
        line: 'invalid',
        character: 15,
      };

      await expect(mcpToolPrepareCallHierarchy.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      prepareCallHierarchySpy.mockRejectedValue(new Error('LSP error'));

      const params = {
        uri: 'file:///test.ts',
        line: 5,
        character: 15,
      };

      await expect(mcpToolPrepareCallHierarchy.handle(params)).rejects.toThrow(McpError);
    });
  });
});
