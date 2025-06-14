import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolDefinition } from './MCPToolDefinition';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { Location } from '../lsp/types/Location';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolDefinition', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolDefinition: MCPToolDefinition;
  let definitionSpy: jest.MockedFunction<LSPServerEx['definition']>;

  beforeEach(() => {
    definitionSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      definition: definitionSpy,
      references: jest.fn(),
      rename: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolDefinition = new MCPToolDefinition(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolDefinition.listItem();

      expect(tool.name).toBe('definition');
      expect(tool.description).toBe('Get definition location for a symbol at a specific position in a TypeScript file');
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

    it('should return declaration location for single result', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };
      definitionSpy.mockResolvedValue(mockLocation);

      const result = await mcpToolDefinition.handle(validParams);

      expect(definitionSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Definition: /src/test.ts:1:1',
      });
    });

    it('should return multiple declaration locations for array result', async () => {
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
      definitionSpy.mockResolvedValue(mockLocations);

      const result = await mcpToolDefinition.handle(validParams);

      expect(result.content).toHaveLength(2);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Definition 1: /src/test1.ts:1:1',
      });
      expect(result.content[1]).toEqual({
        type: 'text',
        text: 'Definition 2: /src/test2.ts:6:3',
      });
    });

    it('should return "No declaration found" for null result', async () => {
      definitionSpy.mockResolvedValue(null);

      const result = await mcpToolDefinition.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No definition found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test.ts',
        // missing line and character
      };

      await expect(mcpToolDefinition.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      definitionSpy.mockRejectedValue(new Error('LSP error'));

      await expect(mcpToolDefinition.handle(validParams)).rejects.toThrow(McpError);
    });

    it('should format range correctly when start and end are different', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 2, character: 5 },
        },
      };
      definitionSpy.mockResolvedValue(mockLocation);

      const result = await mcpToolDefinition.handle(validParams);

      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Definition: /src/test.ts:1:1 to 3:6',
      });
    });
  });
});