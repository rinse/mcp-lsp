import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolTypeDefinition } from './MCPToolTypeDefinition';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { Location } from '../lsp/types/Location';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolTypeDefinition', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolTypeDefinition: MCPToolTypeDefinition;
  let typeDefinitionSpy: jest.MockedFunction<LSPServerEx['typeDefinition']>;

  beforeEach(() => {
    typeDefinitionSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      definition: jest.fn(),
      implementation: jest.fn(),
      references: jest.fn(),
      typeDefinition: typeDefinitionSpy,
      rename: jest.fn(),
      codeAction: jest.fn(),
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
      prepareCallHierarchy: jest.fn(),
      incomingCalls: jest.fn(),
      outgoingCalls: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolTypeDefinition = new MCPToolTypeDefinition(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolTypeDefinition.listItem();

      expect(tool.name).toBe('typeDefinition');
      expect(tool.description).toBe('Get type definition location for a symbol at a specific position in a TypeScript file');
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
    const validParams = {
      uri: 'file:///test.ts',
      line: 10,
      character: 5,
    };

    it('should return type definition location for single result', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };
      typeDefinitionSpy.mockResolvedValue(mockLocation);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(typeDefinitionSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:0:0',
      });
    });

    it('should return multiple type definition locations for array result', async () => {
      const mockLocations: Location[] = [
        {
          uri: 'file:///src/test1.ts',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
        {
          uri: 'file:///src/test2.ts',
          range: {
            start: { line: 5, character: 2 },
            end: { line: 5, character: 2 },
          },
        },
      ];
      typeDefinitionSpy.mockResolvedValue(mockLocations);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Found 2 type definitions:\n/src/test1.ts:0:0\n/src/test2.ts:5:2',
      });
    });

    it('should return single type definition location for single array result', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };
      typeDefinitionSpy.mockResolvedValue([mockLocation]);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Found 1 type definitions:\n/src/test.ts:0:0',
      });
    });

    it('should return "No type definition found" for empty array result', async () => {
      typeDefinitionSpy.mockResolvedValue([]);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No type definition found for symbol at /test.ts:10:5',
      });
    });

    it('should return "No type definition found" for null result', async () => {
      typeDefinitionSpy.mockResolvedValue(null);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No type definition found for symbol at /test.ts:10:5',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test.ts',
        // missing line and character
      };

      await expect(mcpToolTypeDefinition.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      typeDefinitionSpy.mockRejectedValue(new Error('LSP error'));

      await expect(mcpToolTypeDefinition.handle(validParams)).rejects.toThrow(McpError);
    });

    it('should use start position for location formatting', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 2, character: 5 },
        },
      };
      typeDefinitionSpy.mockResolvedValue(mockLocation);

      const result = await mcpToolTypeDefinition.handle(validParams);

      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:0:0-2:5',
      });
    });
  });
});
