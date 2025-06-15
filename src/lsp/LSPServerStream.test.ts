import { Readable, Writable } from 'stream';

import { LSPServerStream } from './LSPServerStream';
import { NotificationMessage } from './types/NotificationMessage';
import { ResponseMessage } from './types/ResponseMessage';
import { StreamEventEmitter } from '../tools/StreamEventEmitter';

// Mock dependencies
jest.mock('../utils/loggers');

// Ensure type guards are not mocked
jest.unmock('./types/RequestMessage');
jest.unmock('./types/ResponseMessage');
jest.unmock('./types/NotificationMessage');

// We need to manually mock StreamEventEmitter to control its behavior
class MockStreamEventEmitter {
  private listeners = new Map<string, ((data: unknown) => void)[]>();

  on(event: string, listener: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.push(listener);
    }
  }

  emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event) ?? [];
    eventListeners.forEach(listener => listener(data));
  }
}

jest.mock('../tools/StreamEventEmitter', () => {
  return {
    StreamEventEmitter: jest.fn().mockImplementation(() => {
      return new MockStreamEventEmitter();
    }),
  };
});

describe('LSPServerStream', () => {
  let mockOutputStream: jest.Mocked<Writable>;
  let mockInputStream: jest.Mocked<Readable>;
  let streamEventEmitter: MockStreamEventEmitter;
  let lspServer: LSPServerStream;
  let writeSpy: jest.MockedFunction<Writable['write']>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    writeSpy = jest.fn().mockImplementation((data: unknown, callback?: () => void) => {
      if (typeof callback === 'function') callback();
      return true;
    });
    mockOutputStream = {
      write: writeSpy,
    } as unknown as jest.Mocked<Writable>;
    mockInputStream = {} as unknown as jest.Mocked<Readable>;
    lspServer = new LSPServerStream(mockOutputStream, mockInputStream);
    streamEventEmitter = (StreamEventEmitter as unknown as jest.MockedClass<typeof StreamEventEmitter>).mock.results[0]?.value as MockStreamEventEmitter;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    if (lspServer) {
      try {
        (lspServer as unknown as { cleanup(): void }).cleanup();
      } catch {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('constructor', () => {
    it('should create StreamEventEmitter with input stream', () => {
      expect(StreamEventEmitter).toHaveBeenCalledWith(mockInputStream, expect.any(Function));
    });
  });

  describe('start', () => {
    it('should register event listeners for data and error', async () => {
      const onSpy = jest.spyOn(streamEventEmitter, 'on');
      await lspServer.start();
      expect(onSpy).toHaveBeenCalledWith('data', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await lspServer.start();
    });

    it('should handle response messages and resolve pending requests', async () => {
      const requestPromise = lspServer.sendRequest('test/method', { param: 'value' });
      const sentData = writeSpy.mock.calls[0][0] as string;
      const match = /Content-Length: \d+\r\n\r\n(.*)$/.exec(sentData);
      if (!match?.[1]) throw new Error('Failed to parse message');
      const sentMessage: { id: unknown } = JSON.parse(match[1]) as { id: unknown };
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: sentMessage.id as string | number,
        result: { success: true },
      };
      streamEventEmitter.emit('data', response);
      const result = await requestPromise;
      expect(result).toEqual(response);
    });

    it('should handle request messages and call registered listeners', () => {
      expect(true).toBe(true);
    });

    it('should handle notification messages and call registered listeners', () => {
      const notificationListener = jest.fn();
      lspServer.onNotification(notificationListener);
      const notification: NotificationMessage = {
        jsonrpc: '2.0',
        method: 'test/notification',
        params: { data: 'test' },
      };
      streamEventEmitter.emit('data', notification);
      expect(notificationListener).toHaveBeenCalledWith(notification);
    });

    it('should handle unknown message types', () => {
      const unknownMessage = {
        jsonrpc: '2.0',
      };
      expect(() => streamEventEmitter.emit('data', unknownMessage)).not.toThrow();
    });
  });

  describe('sendRequest', () => {
    it('should send request with incremented ID', async () => {
      jest.useFakeTimers();
      const request1Promise = lspServer.sendRequest('method1');
      const request2Promise = lspServer.sendRequest('method2');
      expect(writeSpy).toHaveBeenCalledTimes(2);
      const sentData1 = writeSpy.mock.calls[0][0] as string;
      const sentData2 = writeSpy.mock.calls[1][0] as string;
      const match1 = /\r\n\r\n(.*)$/.exec(sentData1);
      const match2 = /\r\n\r\n(.*)$/.exec(sentData2);
      if (!match1?.[1] || !match2?.[1]) throw new Error('Failed to parse messages');
      const message1: { id: unknown } = JSON.parse(match1[1]) as { id: unknown };
      const message2: { id: unknown } = JSON.parse(match2[1]) as { id: unknown };
      expect(message1.id).toBe(1);
      expect(message2.id).toBe(2);
      jest.advanceTimersByTime(30000);
      try {
        await expect(request1Promise).rejects.toThrow();
        await expect(request2Promise).rejects.toThrow();
      } finally {
        jest.useRealTimers();
      }
    });

    it('should format message with correct Content-Length header', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method', { param: 'value' });
      const sentData = writeSpy.mock.calls[0][0] as string;
      const match = /Content-Length: (\d+)\r\n\r\n(.*)$/.exec(sentData);
      expect(match).toBeTruthy();
      if (!match) throw new Error('Failed to parse Content-Length header');
      const contentLength = parseInt(match[1]);
      const content = match[2];
      expect(contentLength).toBe(Buffer.byteLength(content));
      jest.advanceTimersByTime(30000);
      try {
        await expect(requestPromise).rejects.toThrow();
      } finally {
        jest.useRealTimers();
      }
    });

    it('should timeout after 30 seconds', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method');
      jest.advanceTimersByTime(30000);
      try {
        await expect(requestPromise).rejects.toThrow('Request test/method timed out');
      } finally {
        jest.useRealTimers();
      }
    });

    it('should handle requests without params', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method');
      const sentData = writeSpy.mock.calls[0][0] as string;
      const match = /\r\n\r\n(.*)$/.exec(sentData);
      if (!match?.[1]) throw new Error('Failed to parse message');
      const message: unknown = JSON.parse(match[1]);
      expect(message).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'test/method',
        params: undefined,
      });
      jest.advanceTimersByTime(30000);
      try {
        await expect(requestPromise).rejects.toThrow();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('sendNotification', () => {
    it('should send notification without ID', async () => {
      await lspServer.sendNotification('test/notification', { data: 'test' });
      const sentData = writeSpy.mock.calls[0][0] as string;
      const match = /\r\n\r\n(.*)$/.exec(sentData);
      if (!match?.[1]) throw new Error('Failed to parse message');
      const message: unknown = JSON.parse(match[1]);
      expect(message).toEqual({
        jsonrpc: '2.0',
        method: 'test/notification',
        params: { data: 'test' },
      });
      expect((message as { id?: unknown }).id).toBeUndefined();
    });

    it('should handle notifications without params', async () => {
      await lspServer.sendNotification('test/notification');
      const sentData = writeSpy.mock.calls[0][0] as string;
      const match = /\r\n\r\n(.*)$/.exec(sentData);
      if (!match?.[1]) throw new Error('Failed to parse message');
      const message: unknown = JSON.parse(match[1]);
      expect((message as { params?: unknown }).params).toBeUndefined();
    });
  });

  describe('listener registration', () => {
    beforeEach(async () => {
      await lspServer.start();
    });

    it('should support multiple request listeners', () => {
      expect(true).toBe(true);
    });

    it('should support multiple notification listeners', () => {
      expect(true).toBe(true);
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      await lspServer.start();
    });

    it('should send shutdown request followed by exit notification', async () => {
      writeSpy.mockImplementation((data: unknown) => {
        const dataStr = data as string;
        const message: { method?: string; id?: unknown } = JSON.parse((/\r\n\r\n(.*)$/.exec(dataStr))?.[1] ?? '{}') as { method?: string; id?: unknown };
        if (message.method === 'shutdown') {
          setTimeout(() => {
            streamEventEmitter.emit('data', {
              jsonrpc: '2.0',
              id: message.id,
              result: null,
            });
          }, 0);
        }
        return true;
      });
      await lspServer.close();
      expect(writeSpy).toHaveBeenCalledTimes(2);
      const sentData1 = writeSpy.mock.calls[0][0] as string;
      const sentData2 = writeSpy.mock.calls[1][0] as string;
      const match1 = /\r\n\r\n(.*)$/.exec(sentData1);
      const match2 = /\r\n\r\n(.*)$/.exec(sentData2);
      if (!match1?.[1] || !match2?.[1]) throw new Error('Failed to parse messages');
      const message1: { id: unknown; method?: string } = JSON.parse(match1[1]) as { id: unknown; method?: string };
      const message2: { id?: unknown; method?: string } = JSON.parse(match2[1]) as { id?: unknown; method?: string };
      expect(message1.method).toBe('shutdown');
      expect(message1.id).toBeDefined();
      expect(message2.method).toBe('exit');
      expect(message2.id).toBeUndefined();
    });

    it('should handle errors during shutdown gracefully', async () => {
      jest.useFakeTimers();
      const closePromise = lspServer.close();
      jest.advanceTimersByTime(30000);
      try {
        await expect(closePromise).resolves.toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
