import { McpError } from '@modelcontextprotocol/sdk/types.js';

import { MCPToolHover } from './MCPToolHover';
import { LSPManager } from '../lsp/LSPManager';
import { LSPServerEx } from '../lsp/LSPServerEx';
import { Hover } from '../lsp/types/HoverRequest';
import { MarkedString } from '../lsp/types/MarkedString';
import { MarkupContent, MarkupKind } from '../lsp/types/MarkupContent';

// Mock the readFileAsync function
jest.mock('../utils', () => ({
  readFileAsync: jest.fn().mockResolvedValue('mock file content'),
}));

describe('MCPToolHover', () => {
  let mockLSPServerEx: jest.Mocked<LSPServerEx>;
  let lspManager: LSPManager;
  let mcpToolHover: MCPToolHover;
  let hoverSpy: jest.MockedFunction<LSPServerEx['hover']>;

  beforeEach(() => {
    hoverSpy = jest.fn();
    mockLSPServerEx = {
      initialize: jest.fn(),
      initialized: jest.fn(),
      didOpen: jest.fn().mockResolvedValue(undefined),
      didClose: jest.fn().mockResolvedValue(undefined),
      hover: hoverSpy,
      definition: jest.fn(),
      implementation: jest.fn(),
      references: jest.fn(),
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
    mcpToolHover = new MCPToolHover(lspManager);
  });

  describe('listItem', () => {
    it('should return the correct tool description', () => {
      const tool = mcpToolHover.listItem();

      expect(tool.name).toBe('list_hover_info');
      expect(tool.description).toContain('Retrieve hover information (type signature and inline documentation)');
      expect(tool.inputSchema).toEqual({
        type: 'object',
        properties: {
          uri: {
            type: 'string',
            description: 'Required. File URI (e.g., file:///path/to/file.ts)',
          },
          line: {
            type: 'number',
            description: 'Required. 0-based line index where the cursor is.',
          },
          character: {
            type: 'number',
            description: 'Required. 0-based character (column) index on that line.',
          },
        },
        required: ['uri', 'line', 'character'],
      });
    });
  });

  describe('handle', () => {
    const validParams = {
      uri: 'file:///test/file.ts',
      line: 10,
      character: 5,
    };

    it('should handle hover with string content', async () => {
      const hoverResult: Hover = {
        contents: 'Test hover content',
      };
      hoverSpy.mockResolvedValue(hoverResult);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  Type: Test hover content',
        }],
      });
      expect(hoverSpy).toHaveBeenCalledWith({
        textDocument: { uri: validParams.uri },
        position: { line: validParams.line, character: validParams.character },
      });
    });

    it('should handle hover with MarkedString object', async () => {
      const hoverResult: Hover = {
        contents: {
          language: 'javascript',
          value: 'function test() { return 42; }',
        } satisfies MarkedString,
      };
      hoverSpy.mockResolvedValue(hoverResult);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  Type: function test() { return 42; }',
        }],
      });
    });

    it('should handle hover with MarkedString array content', async () => {
      const hoverResult: Hover = {
        contents: [
          { language: 'typescript', value: 'const x = 5;' } satisfies MarkedString,
        ],
      };
      hoverSpy.mockResolvedValue(hoverResult);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  Type: const x = 5;',
        }],
      });
    });

    it('should handle hover with MarkupContent', async () => {
      const hoverResult: Hover = {
        contents: {
          kind: MarkupKind.Markdown,
          value: '# Header\n\nSome **markdown** content',
        } as MarkupContent,
      };
      hoverSpy.mockResolvedValue(hoverResult);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  Type: # Header\n  Docs: Some **markdown** content',
        }],
      });
    });

    it('should handle hover returning null', async () => {
      hoverSpy.mockResolvedValue(null);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  No hover information available',
        }],
      });
    });

    it('should throw error for invalid parameters', async () => {
      const invalidParams = {
        uri: 'file:///test/file.ts',
        line: 'not a number', // Invalid type
        character: 5,
      };
      await expect(mcpToolHover.handle(invalidParams)).rejects.toThrow(McpError);
      await expect(mcpToolHover.handle(invalidParams)).rejects.toThrow('Invalid parameters for list_hover_info tool');
    });

    it('should throw error when missing required parameters', async () => {
      const missingParams = {
        uri: 'file:///test/file.ts',
        // Missing line and character
      };
      await expect(mcpToolHover.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolHover.handle(missingParams)).rejects.toThrow('Invalid parameters for list_hover_info tool');
    });

    it('should handle errors from LSP server', async () => {
      const serverError = new Error('LSP server error');
      mockLSPServerEx.hover.mockRejectedValue(serverError);
      await expect(mcpToolHover.handle(validParams)).rejects.toThrow(McpError);
      await expect(mcpToolHover.handle(validParams)).rejects.toThrow('Failed to get hover information: Error: LSP server error');
    });

    it('should handle hover with range', async () => {
      const hoverResult: Hover = {
        contents: 'Test content with range',
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 10 },
        },
      };
      hoverSpy.mockResolvedValue(hoverResult);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: '/test/file.ts:10:5\n  Type: Test content with range',
        }],
      });
    });
  });
});
