import { StreamParseResult } from '../tools/StreamEventEmitter';
import { logger } from '../utils/logger';
import { Message, MessageT } from './types/AbstractMessage';

const separator = '\r\n\r\n' as const;
const lengthOfSeparator = Buffer.byteLength(separator);

/**
 * Reads a LSPMessage from a Buffer.
 *
 * When the buffer contains a complete LSP message, it returns an object.
 * Otherwise, it returns an object indicating that more data is needed.
 * If the buffer contains an invalid message, it returns an error object.
 */
export function readLSPMessageFromBuffer(buffer: Buffer): StreamParseResult<Message> {
  const str = buffer.toString('utf8');
  const headerEnd = str.indexOf(separator);
  if (headerEnd === -1) {
    return { kind: 'waiting' };
  }
  const header = str.substring(0, headerEnd);
  const contentLengthMatch = header.match(/Content-Length: (\d+)/);
  if (!contentLengthMatch) {
    return { kind: 'error', consume: headerEnd + lengthOfSeparator, message: 'Invalid header, missing Content-Length' };
  }
  const contentLength = parseInt(contentLengthMatch[1]);
  const messageStart = headerEnd + 4;
  const messageEnd = messageStart + contentLength;
  if (buffer.length < messageEnd) {
    return { kind: 'waiting' };
  }
  const messageContent = str.substring(messageStart, messageEnd);
  try {
    const message = JSON.parse(messageContent);
    if (MessageT.is(message)) {
      return { kind: 'success', value: message, consume: messageEnd };
    }
    logger.error('[LSP] Failed to validate message', { content: str });
    return { kind: 'error', consume: messageEnd, message: `Failed to validate message. ${messageContent}` };
  } catch (error) {
    logger.error('[LSP] Failed to parse message', { content: str });
    return { kind: 'error', consume: messageEnd, message: `Failed to parse message. ${messageContent}` };
  }
}
