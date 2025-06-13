import Stream from 'stream';

import { readLSPMessageFromBuffer } from './LSPMessageParser';
import { LSPServer } from './LSPServer';
import { Message } from './types/AbstractMessage';
import { NotificationMessage, isNotificationMessage } from './types/NotificationMessage';
import { isRequestMessage, RequestMessage } from './types/RequestMessage';
import { isResponseMessage, ResponseMessage } from './types/ResponseMessage';
import { StreamEventEmitter } from '../tools/StreamEventEmitter';
import { logger } from '../utils/logger';

export class LSPServerStream implements LSPServer {
  private streamEventEmitter: StreamEventEmitter<Message>;
  private requestId = 0;
  private pendingRequests = new Map<number | string | null, (response: ResponseMessage) => void>();
  private requestListeners: ((message: RequestMessage) => void)[] = [];
  private notificationListeners: ((message: NotificationMessage) => void)[] = [];
  private requestTimeouts = new Map<number | string | null, NodeJS.Timeout>();

  constructor(private outputStream: Stream.Writable, private inputStream: Stream.Readable) {
    this.streamEventEmitter = new StreamEventEmitter(this.inputStream, readLSPMessageFromBuffer);
  }

  /**
     * Starts the LSP server by listening to its stdout and stderr streams.
     */
  async start(): Promise<void> {
    this.streamEventEmitter.on('data', (message: Message) => {
      this.handleMessage(message);
    });
    this.streamEventEmitter.on('error', (error: Error) => {
      logger.error('[LSP] Stream parsing error', { error });
    });
  }

  private handleMessage(message: Message) {
    logger.debug('[LSP] Received message', { message });
    if (isResponseMessage(message)) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        pending(message);
        this.pendingRequests.delete(message.id);
        const timeout = this.requestTimeouts.get(message.id);
        if (timeout) {
          clearTimeout(timeout);
          this.requestTimeouts.delete(message.id);
        }
      }
    } else if (isRequestMessage(message)) {
      this.requestListeners.forEach(listener => listener(message));
    } else if (isNotificationMessage(message)) {
      this.notificationListeners.forEach(listener => listener(message));
    } else {
      logger.warn('[LSP] Received unknown message type', { message });
    }
  }

  /**
     * Send a request to the LSP server.
     */
  async sendRequest(method: RequestMessage["method"], params?: RequestMessage["params"]): Promise<ResponseMessage> {
    const id = ++this.requestId;
    const message: RequestMessage = { jsonrpc: '2.0', id, method, params };
    this.sendMessage(message);
    return new Promise<ResponseMessage>((resolve, reject) => {
      this.pendingRequests.set(id, (response) => {
        resolve(response);
      });
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          this.requestTimeouts.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
      this.requestTimeouts.set(id, timeout);
    });
  }

  /**
     * Send a notification to the LSP server.
     */
  async sendNotification(method: string, params?: object | unknown[]): Promise<void> {
    const message: NotificationMessage = { jsonrpc: '2.0', method, params };
    this.sendMessage(message);
  }

  private sendMessage(message: Message): void {
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content)}\r\n\r\n`;
    this.outputStream.write(header + content);
  }

  onRequest(callback: (message: RequestMessage) => void): void {
    this.requestListeners.push(callback);
  }

  onNotification(callback: (message: NotificationMessage) => void): void {
    this.notificationListeners.push(callback);
  }

  /**
     * Closes the LSP server connection and shuts down the process.
     */
  async close(): Promise<void> {
    try {
      await this.sendRequest('shutdown');
      this.sendNotification('exit');
    } catch (error) {
      logger.error('[LSP] Error during shutdown', { error });
    } finally {
      this.cleanup();
    }
  }

  private cleanup(): void {
    this.requestTimeouts.forEach(timeout => clearTimeout(timeout));
    this.requestTimeouts.clear();
    this.pendingRequests.clear();
  }
}
