import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Message } from './types/AbstractMessage';
import { isResponseMessage, ResponseMessage } from './types/ResponseMessage';
import { isRequestMessage, RequestMessage } from './types/RequestMessage';
import { NotificationMessage, isNotificationMessage } from './types/NotificationMessage';
import { LSPServer } from './LSPServer';
import { logger } from '../utils/logger.js';

export class LSPServerStdio implements LSPServer {
    private eventEmitter = new EventEmitter();
    private process: ChildProcess;
    private messageBuffer = '';
    private requestId = 0;
    private pendingRequests = new Map<number | string | null, (response: ResponseMessage) => void>();

    constructor(process: ChildProcess) {
        this.process = process;
    }

    /**
     * Starts the LSP server by listening to its stdout and stderr streams.
     */
    async start(): Promise<void> {
        this.process.stdout?.on('data', (data: Buffer) => {
            this.messageBuffer += data.toString();
            this.receiveMessages();
        });
        this.process.stderr?.on('data', (data: Buffer) => {
            logger.warn('[LSP stderr]', { stderr: data.toString() });
        });
        this.process.on('error', (error) => {
            logger.error('[LSP] Process error', { error });
            this.eventEmitter.emit('error', error);
        });
        this.process.on('exit', (code, signal) => {
            logger.info('[LSP] Process exited', { code, signal });
            this.eventEmitter.emit('exit', code, signal);
        });
    }

    /**
     * Send a request to the LSP server.
     */
    async sendRequest(method: string, params?: object | unknown[]): Promise<ResponseMessage> {
        const id = ++this.requestId;
        const message: RequestMessage = { jsonrpc: '2.0', id, method, params };
        this.sendMessage(message);
        return new Promise<ResponseMessage>((resolve, reject) => {
            this.pendingRequests.set(id, (response) => { resolve(response) });
            // Set a timeout to reject the request if it takes too long
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request ${method} timed out`));
                }
            }, 30000); // 30 seconds timeout
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
        this.process?.stdin?.write(header + content);
    }

    /**
     * Receives messages from the LSP server.
     */
    private receiveMessages() {
        while (true) {
            const headerEnd = this.messageBuffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) {
                break;
            }
            const header = this.messageBuffer.substring(0, headerEnd);
            const contentLengthMatch = header.match(/Content-Length: (\d+)/);
            if (!contentLengthMatch) {
                logger.warn('[LSP] Invalid header, missing Content-Length');
                this.messageBuffer = this.messageBuffer.substring(headerEnd + 4);
                continue;
            }
            const contentLength = parseInt(contentLengthMatch[1]);
            const messageStart = headerEnd + 4;
            const messageEnd = messageStart + contentLength;
            if (this.messageBuffer.length < messageEnd) {
                break; // Not enough data for a complete message
            }
            const messageContent = this.messageBuffer.substring(messageStart, messageEnd);
            this.messageBuffer = this.messageBuffer.substring(messageEnd);
            try {
                const message: Message = JSON.parse(messageContent);
                this.handleMessage(message);
            } catch (error) {
                logger.error('[LSP] Failed to parse message', { error, messageContent });
            }
        }
    }

    private handleMessage(message: Message) {
        logger.debug('[LSP] Received message', { message });
        if (isResponseMessage(message)) {
            const pending = this.pendingRequests.get(message.id);
            if (pending) {
                pending(message);
                this.pendingRequests.delete(message.id);
            }
        } else if (isRequestMessage(message)) {
            this.eventEmitter.emit('request', message);
        } else if (isNotificationMessage(message)) {
            logger.debug('[LSP] Received notification', { message });
        } else {
            logger.warn('[LSP] Received unknown message type', { message });
        }
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
            this.process.kill();
        }
    }
}
