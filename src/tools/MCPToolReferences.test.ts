import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolReferences } from './MCPToolReferences';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { Location } from '../lsp/types/Location';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolReferences', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolReferences: MCPToolReferences;
  let referencesSpy: jest.MockedFunction<LSPServerEx['references']>;

  beforeEach(() => {
    referencesSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: jest.fn(),
      definition: jest.fn(),
      implementation: jest.fn(),
      references: referencesSpy,
      typeDefinition: jest.fn(),
      rename: jest.fn(),
      codeAction: jest.fn(),
      executeCommand: jest.fn(),
      applyEdit: jest.fn(),
      prepareCallHierarchy: jest.fn(),
      incomingCalls: jest.fn(),
      outgoingCalls: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolReferences = new MCPToolReferences(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolReferences.listItem();

      expect(tool.name).toBe('references');
      expect(tool.description).toBe('Get all references to a symbol at a specific position in a TypeScript file');
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
          includeDeclaration: {
            type: 'boolean',
            description: 'Whether to include the symbol declaration in the results (defaults to true)',
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

    it('should return references for multiple results', async () => {
      const mockReferences: Location[] = [
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
      referencesSpy.mockResolvedValue(mockReferences);

      const result = await mcpToolReferences.handle(validParams);

      expect(referencesSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        context: { includeDeclaration: true },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Found 2 references:\n  /src/test1.ts:1:1\n  /src/test2.ts:6:3',
      });
    });

    it('should handle includeDeclaration parameter', async () => {
      const mockReferences: Location[] = [
        {
          uri: 'file:///src/test.ts',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
      referencesSpy.mockResolvedValue(mockReferences);

      const paramsWithDeclaration = {
        ...validParams,
        includeDeclaration: false,
      };

      const result = await mcpToolReferences.handle(paramsWithDeclaration);

      expect(referencesSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        context: { includeDeclaration: false },
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:1:1',
      });
    });

    it('should default includeDeclaration to true', async () => {
      const mockReferences: Location[] = [
        {
          uri: 'file:///src/test.ts',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
      referencesSpy.mockResolvedValue(mockReferences);

      await mcpToolReferences.handle(validParams);

      expect(referencesSpy).toHaveBeenCalledWith({
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        context: { includeDeclaration: true },
      });
    });

    it('should return "No references found" for null result', async () => {
      referencesSpy.mockResolvedValue(null);

      const result = await mcpToolReferences.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No references found.',
      });
    });

    it('should return "No references found" for empty array result', async () => {
      referencesSpy.mockResolvedValue([]);

      const result = await mcpToolReferences.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'No references found.',
      });
    });

    it('should throw McpError for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test.ts',
        // missing line and character
      };

      await expect(mcpToolReferences.handle(invalidParams)).rejects.toThrow(McpError);
    });

    it('should throw McpError when LSP request fails', async () => {
      referencesSpy.mockRejectedValue(new Error('LSP error'));

      await expect(mcpToolReferences.handle(validParams)).rejects.toThrow(McpError);
    });

    it('should format range correctly when start and end are different', async () => {
      const mockReferences: Location[] = [
        {
          uri: 'file:///src/test.ts',
          range: {
            start: { line: 0, character: 0 },
            end: { line: 2, character: 5 },
          },
        },
      ];
      referencesSpy.mockResolvedValue(mockReferences);

      const result = await mcpToolReferences.handle(validParams);

      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:1:1-3:6',
      });
    });

    it('should handle single reference result', async () => {
      const mockReferences: Location[] = [
        {
          uri: 'file:///src/test.ts',
          range: {
            start: { line: 10, character: 5 },
            end: { line: 10, character: 15 },
          },
        },
      ];
      referencesSpy.mockResolvedValue(mockReferences);

      const result = await mcpToolReferences.handle(validParams);

      expect(result.content).toHaveLength(1);
      expect(result.content[0]).toEqual({
        type: 'text',
        text: '/src/test.ts:11:6-11:16',
      });
    });
  });
});
