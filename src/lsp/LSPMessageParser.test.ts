import { readLSPMessageFromBuffer } from './LSPMessageParser';

describe('readLSPMessageFromBuffer', () => {
  it('should return waiting when buffer has no separator', () => {
    const buffer = Buffer.from('Content-Length: 50');
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({ kind: 'waiting' });
  });

  it('should return error when header is missing Content-Length', () => {
    const buffer = Buffer.from('Invalid-Header: test\r\n\r\n{"jsonrpc":"2.0"}');
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({
      kind: 'error',
      consume: 24,
      message: 'Invalid header, missing Content-Length'
    });
  });

  it('should return waiting when buffer is shorter than expected message length', () => {
    const buffer = Buffer.from('Content-Length: 50\r\n\r\n{"jsonrpc":"2.0"}');
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({ kind: 'waiting' });
  });

  it('should return success for valid LSP message', () => {
    const messageContent = '{"jsonrpc":"2.0","id":1,"method":"test"}';
    const contentLength = Buffer.byteLength(messageContent, 'utf8');
    const buffer = Buffer.from(`Content-Length: ${contentLength}\r\n\r\n${messageContent}`);
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({
      kind: 'success',
      value: {"jsonrpc":"2.0","id":1,"method":"test"},
      consume: buffer.length
    });
  });

  it('should return error for invalid JSON message', () => {
    const messageContent = '{"invalid":json}';
    const contentLength = Buffer.byteLength(messageContent, 'utf8');
    const buffer = Buffer.from(`Content-Length: ${contentLength}\r\n\r\n${messageContent}`);
    const result = readLSPMessageFromBuffer(buffer);
    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.consume).toBe(buffer.length);
      expect(result.message).toContain('Failed to parse message');
    }
  });

  it('should handle message with additional headers', () => {
    const messageContent = '{"jsonrpc":"2.0","method":"notification"}';
    const contentLength = Buffer.byteLength(messageContent, 'utf8');
    const buffer = Buffer.from(`Content-Length: ${contentLength}\r\nContent-Type: application/vscode-jsonrpc; charset=utf-8\r\n\r\n${messageContent}`);
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({
      kind: 'success',
      value: {"jsonrpc":"2.0","method":"notification"},
      consume: buffer.length
    });
  });

  it('should handle buffer with excess data after message', () => {
    const messageContent = '{"jsonrpc":"2.0"}';
    const contentLength = Buffer.byteLength(messageContent, 'utf8');
    const buffer = Buffer.from(`Content-Length: ${contentLength}\r\n\r\n${messageContent}EXTRA_DATA`);
    const result = readLSPMessageFromBuffer(buffer);
    const headerLength = Buffer.byteLength(`Content-Length: ${contentLength}\r\n\r\n`, 'utf8');
    expect(result).toEqual({
      kind: 'success',
      value: {"jsonrpc":"2.0"},
      consume: headerLength + contentLength
    });
  });

  it('should handle Content-Length with leading zeros', () => {
    const messageContent = '{"jsonrpc":"2.0"}';
    const contentLength = Buffer.byteLength(messageContent, 'utf8');
    const buffer = Buffer.from(`Content-Length: 00${contentLength}\r\n\r\n${messageContent}`);
    const result = readLSPMessageFromBuffer(buffer);
    expect(result).toEqual({
      kind: 'success',
      value: {"jsonrpc":"2.0"},
      consume: buffer.length
    });
  });
});
