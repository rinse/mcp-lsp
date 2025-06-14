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
      references: jest.fn(),
      rename: jest.fn(),
      applyEdit: jest.fn(),
    };
    lspManager = new LSPManager(mockLSPServerEx);
    mcpToolHover = new MCPToolHover(lspManager);
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
          text: 'Test hover content',
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
          text: JSON.stringify({
            language: 'javascript',
            value: 'function test() { return 42; }',
          }),
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
        content: [
          {
            type: 'text',
            text: `{"language":"typescript","value":"const x = 5;"}`,
          },
        ],
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
          text: '# Header\n\nSome **markdown** content',
        }],
      });
    });

    it('should handle hover returning null', async () => {
      hoverSpy.mockResolvedValue(null);
      const result = await mcpToolHover.handle(validParams);
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: 'No output.',
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
      await expect(mcpToolHover.handle(invalidParams)).rejects.toThrow('Invalid parameters for hover tool');
    });

    it('should throw error when missing required parameters', async () => {
      const missingParams = {
        uri: 'file:///test/file.ts',
        // Missing line and character
      };
      await expect(mcpToolHover.handle(missingParams)).rejects.toThrow(McpError);
      await expect(mcpToolHover.handle(missingParams)).rejects.toThrow('Invalid parameters for hover tool');
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
          text: 'Test content with range',
        }],
      });
    });
  });
});
