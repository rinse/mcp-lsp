import { StreamParser, StreamParseResult } from '../tools/StreamEventEmitter';
import { Message } from './types/AbstractMessage';

/**
 * Creates a StreamParser for LSP messages that parses Content-Length headers
 * followed by JSON-RPC message content.
 */
export function createLSPMessageParser(): StreamParser<Message> {
  return (buffer: Buffer): StreamParseResult<Message> => {
    const str = buffer.toString('utf8');
    const headerEnd = str.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      return { kind: 'waiting' };
    }
    const header = str.substring(0, headerEnd);
    const contentLengthMatch = header.match(/Content-Length: (\d+)/);
    if (!contentLengthMatch) {
      return { kind: 'error', consume: headerEnd + 4 };
    }
    const contentLength = parseInt(contentLengthMatch[1]);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + contentLength;
    if (buffer.length < messageEnd) {
      return { kind: 'waiting' };
    }
    try {
      const messageContent = str.substring(messageStart, messageEnd);
      const message: Message = JSON.parse(messageContent);
      return { kind: 'emit', value: message, consume: messageEnd };
    } catch (error) {
      return { kind: 'error', consume: messageEnd };
    }
  };
}