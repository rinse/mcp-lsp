import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { LSPServer } from './LSPServer';
import { LSPServerExImpl } from './LSPServerExImpl';
import { ApplyWorkspaceEditParams, ApplyWorkspaceEditResult } from './types/ApplyWorkspaceEditParams';
import { DidCloseTextDocumentParams } from './types/DidCloseTextDocument';
import { DidOpenTextDocumentParams } from './types/DidOpenTextDocument';
import { HoverParams, Hover } from './types/HoverRequest';
import { InitializeParams } from './types/Initialize';
import { InitializedParams } from './types/Initialized';
import { MarkupContent } from './types/MarkupContent';
import { RenameParams } from './types/RenameRequest';
import { ResponseMessage } from './types/ResponseMessage';
import { WorkspaceEdit } from './types/WorkspaceEdit';

describe('LSPServerExImpl', () => {
  let mockLSPServer: jest.Mocked<LSPServer>;
  let lspServerEx: LSPServerExImpl;

  let sendRequestSpy: jest.MockedFunction<LSPServer['sendRequest']>;
  let sendNotificationSpy: jest.MockedFunction<LSPServer['sendNotification']>;
  let onRequestSpy: jest.MockedFunction<LSPServer['onRequest']>;
  let onNotificationSpy: jest.MockedFunction<LSPServer['onNotification']>;

  beforeEach(() => {
    sendRequestSpy = jest.fn();
    sendNotificationSpy = jest.fn();
    onRequestSpy = jest.fn();
    onNotificationSpy = jest.fn();
    mockLSPServer = {
      sendRequest: sendRequestSpy,
      sendNotification: sendNotificationSpy,
      onRequest: onRequestSpy,
      onNotification: onNotificationSpy,
    };
    lspServerEx = new LSPServerExImpl(mockLSPServer);
  });

  describe('initialize', () => {
    it('should send initialize request and return response', async () => {
      const params: InitializeParams = {
        processId: 12345,
        rootUri: 'file:///workspace',
        capabilities: {},
      };
      const expectedResponse: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          capabilities: {
            hoverProvider: true,
            renameProvider: true,
          },
        },
      };
      sendRequestSpy.mockResolvedValue(expectedResponse);
      const result = await lspServerEx.initialize(params);
      expect(sendRequestSpy).toHaveBeenCalledWith('initialize', params);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle error responses', async () => {
      const params: InitializeParams = {
        processId: null,
        rootUri: null,
        capabilities: {},
      };
      const errorResponse: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32602,
          message: 'Invalid params',
        },
      };
      sendRequestSpy.mockResolvedValue(errorResponse);
      const result = await lspServerEx.initialize(params);
      expect(result).toEqual(errorResponse);
    });
  });

  describe('initialized', () => {
    it('should send initialized notification', async () => {
      const params: InitializedParams = {};
      await lspServerEx.initialized(params);
      expect(sendNotificationSpy).toHaveBeenCalledWith('initialized', params);
    });
  });

  describe('hover', () => {
    it('should return hover information for valid response', async () => {
      const params: HoverParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      };
      const hoverResult: Hover = {
        contents: {
          kind: 'markdown',
          value: '```typescript\nconst foo: string\n```',
        } satisfies MarkupContent,
        range: {
          start: { line: 10, character: 0 },
          end: { line: 10, character: 10 },
        },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          contents: {
            kind: 'markdown',
            value: '```typescript\nconst foo: string\n```',
          },
          range: {
            start: { line: 10, character: 0 },
            end: { line: 10, character: 10 },
          },
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.hover(params);
      expect(sendRequestSpy).toHaveBeenCalledWith('textDocument/hover', params);
      expect(result).toEqual(hoverResult);
    });

    it('should return null for null result', async () => {
      const params: HoverParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 0, character: 0 },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: null,
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.hover(params);
      expect(result).toBeNull();
    });

    it('should return null for invalid hover response', async () => {
      const params: HoverParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { invalid: 'response' },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.hover(params);
      expect(result).toBeNull();
    });

    it('should return null for error response', async () => {
      const params: HoverParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32602,
          message: 'Invalid params',
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.hover(params);
      expect(result).toBeNull();
    });
  });

  describe('rename', () => {
    it('should return workspace edit for valid response', async () => {
      const params: RenameParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        newName: 'newVariableName',
      };
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              newText: 'newVariableName',
            },
          ],
        },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          changes: {
            'file:///test.ts': [
              {
                range: {
                  start: { line: 10, character: 5 },
                  end: { line: 10, character: 15 },
                },
                newText: 'newVariableName',
              },
            ],
          },
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.rename(params);
      expect(sendRequestSpy).toHaveBeenCalledWith('textDocument/rename', params);
      expect(result).toEqual(workspaceEdit);
    });

    it('should return null for null result', async () => {
      const params: RenameParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 0, character: 0 },
        newName: 'newName',
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: null,
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.rename(params);
      expect(result).toBeNull();
    });

    it('should handle complex workspace edit with multiple files', async () => {
      const params: RenameParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        newName: 'renamedFunction',
      };
      const workspaceEdit: WorkspaceEdit = {
        changes: {
          'file:///test.ts': [
            {
              range: {
                start: { line: 10, character: 5 },
                end: { line: 10, character: 15 },
              },
              newText: 'renamedFunction',
            },
            {
              range: {
                start: { line: 20, character: 10 },
                end: { line: 20, character: 20 },
              },
              newText: 'renamedFunction',
            },
          ],
          'file:///other.ts': [
            {
              range: {
                start: { line: 5, character: 0 },
                end: { line: 5, character: 10 },
              },
              newText: 'renamedFunction',
            },
          ],
        },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          changes: {
            'file:///test.ts': [
              {
                range: {
                  start: { line: 10, character: 5 },
                  end: { line: 10, character: 15 },
                },
                newText: 'renamedFunction',
              },
              {
                range: {
                  start: { line: 20, character: 10 },
                  end: { line: 20, character: 20 },
                },
                newText: 'renamedFunction',
              },
            ],
            'file:///other.ts': [
              {
                range: {
                  start: { line: 5, character: 0 },
                  end: { line: 5, character: 10 },
                },
                newText: 'renamedFunction',
              },
            ],
          },
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.rename(params);
      expect(result).toEqual(workspaceEdit);
    });

    it('should return null for invalid workspace edit response', async () => {
      const params: RenameParams = {
        textDocument: { uri: 'file:///test.ts' },
        position: { line: 10, character: 5 },
        newName: 'newName',
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { changes: 'invalid_type_not_object' },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.rename(params);
      expect(result).toBeNull();
    });
  });

  describe('didOpen', () => {
    it('should send didOpen notification', async () => {
      const params: DidOpenTextDocumentParams = {
        textDocument: {
          uri: 'file:///test.ts',
          languageId: 'typescript',
          version: 1,
          text: 'const foo = "bar";',
        },
      };
      await lspServerEx.didOpen(params);
      expect(sendNotificationSpy).toHaveBeenCalledWith('textDocument/didOpen', params);
    });
  });

  describe('didClose', () => {
    it('should send didClose notification', async () => {
      const params: DidCloseTextDocumentParams = {
        textDocument: {
          uri: 'file:///test.ts',
        },
      };
      await lspServerEx.didClose(params);
      expect(sendNotificationSpy).toHaveBeenCalledWith('textDocument/didClose', params);
    });
  });

  describe('applyEdit', () => {
    it('should apply workspace edit and return success result', async () => {
      const params: ApplyWorkspaceEditParams = {
        edit: {
          changes: {
            'file:///test.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 5 },
                },
                newText: 'hello',
              },
            ],
          },
        },
      };
      const expectedResult: ApplyWorkspaceEditResult = {
        applied: true,
        failureReason: undefined,
        failedChange: undefined,
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          applied: true,
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.applyEdit(params);
      expect(sendRequestSpy).toHaveBeenCalledWith('workspace/applyEdit', params);
      expect(result).toEqual(expectedResult);
    });

    it('should handle failed edit application', async () => {
      const params: ApplyWorkspaceEditParams = {
        edit: {
          changes: {
            'file:///readonly.ts': [
              {
                range: {
                  start: { line: 0, character: 0 },
                  end: { line: 0, character: 5 },
                },
                newText: 'hello',
              },
            ],
          },
        },
      };
      const expectedResult: ApplyWorkspaceEditResult = {
        applied: false,
        failureReason: 'File is read-only',
        failedChange: undefined,
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          applied: false,
          failureReason: 'File is read-only',
          ...{},
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      const result = await lspServerEx.applyEdit(params);
      expect(result).toEqual(expectedResult);
    });

    it('should throw error for invalid apply edit response', async () => {
      const params: ApplyWorkspaceEditParams = {
        edit: {
          changes: {},
        },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { invalid: 'response' },
      };
      sendRequestSpy.mockResolvedValue(response);
      await expect(lspServerEx.applyEdit(params)).rejects.toThrow('[LSP] Invalid applyEdit result:');
    });

    it('should throw error for error response', async () => {
      const params: ApplyWorkspaceEditParams = {
        edit: {
          changes: {},
        },
      };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32602,
          message: 'Invalid workspace edit',
        },
      };
      sendRequestSpy.mockResolvedValue(response);
      await expect(lspServerEx.applyEdit(params)).rejects.toThrow('Invalid workspace edit');
    });
  });
});
