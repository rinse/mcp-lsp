import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolImplementation } from './MCPToolImplementation';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { Location } from '../lsp/types/Location';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolImplementation', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolImplementation: MCPToolImplementation;
  let implementationSpy: jest.MockedFunction<LSPServerEx['implementation']>;

  beforeEach(() => {
    implementationSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      completion: jest.fn(),
      definition: jest.fn(),
      implementation: implementationSpy,
      references: jest.fn(),
      typeDefinition: jest.fn(),
      rename: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolImplementation = new MCPToolImplementation(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolImplementation.listItem();
      expect(tool.name).toBe('implementation');
      expect(tool.description).toBe('Get implementation location for a symbol at a specific position in a TypeScript file');
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

    it('should return implementation location for single result', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
        },
      };
      implementationSpy.mockResolvedValue(mockLocation);
      const result = await mcpToolImplementation.handle(validParams);
      expect(implementationSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:1:1',
      });
    });

    it('should return single implementation without prefix for array with one result', async () => {
      const mockLocations: Location[] = [
        {
          uri: 'file:///src/single.ts',
          range: {
            start: { line: 10, character: 5 },
            end: { line: 10, character: 5 },
          },
        },
      ];
      implementationSpy.mockResolvedValue(mockLocations);
      const result = await mcpToolImplementation.handle(validParams);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/single.ts:11:6',
      });
    });

    it('should return multiple implementation locations for array result', async () => {
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
      implementationSpy.mockResolvedValue(mockLocations);
      const result = await mcpToolImplementation.handle(validParams);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Found 2 implementations:\n  /src/test1.ts:1:1\n  /src/test2.ts:6:3',
      });
    });

    it('should return "No implementation found" for null result', async () => {
      implementationSpy.mockResolvedValue(null);
      const result = await mcpToolImplementation.handle(validParams);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No implementation found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test.ts',
        // missing line and character
      };

      await expect(mcpToolImplementation.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      implementationSpy.mockRejectedValue(new Error('LSP error'));

      await expect(mcpToolImplementation.handle(validParams)).rejects.toThrow(McpError);
    });

    it('should format range correctly when start and end are different', async () => {
      const mockLocation: Location = {
        uri: 'file:///src/test.ts',
        range: {
          start: { line: 0, character: 0 },
          end: { line: 2, character: 5 },
        },
      };
      implementationSpy.mockResolvedValue(mockLocation);

      const result = await mcpToolImplementation.handle(validParams);

      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:1:1-3:6',
      });
    });
  });
});
