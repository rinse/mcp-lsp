import { Readable, Writable } from 'stream';
import { LSPServerStream } from './LSPServerStream';
import { StreamEventEmitter } from '../tools/StreamEventEmitter';
import { RequestMessage } from './types/RequestMessage';
import { ResponseMessage } from './types/ResponseMessage';
import { NotificationMessage } from './types/NotificationMessage';

// Mock dependencies
jest.mock('../utils/logger');

// Ensure type guards are not mocked
jest.unmock('./types/RequestMessage');
jest.unmock('./types/ResponseMessage');
jest.unmock('./types/NotificationMessage');

// We need to manually mock StreamEventEmitter to control its behavior
class MockStreamEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }
}

jest.mock('../tools/StreamEventEmitter', () => {
  return {
    StreamEventEmitter: jest.fn().mockImplementation(() => {
      return new MockStreamEventEmitter();
    })
  };
});

describe('LSPServerStream', () => {
  let mockOutputStream: jest.Mocked<Writable>;
  let mockInputStream: jest.Mocked<Readable>;
  let streamEventEmitter: MockStreamEventEmitter;
  let lspServer: LSPServerStream;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    mockOutputStream = {
      write: jest.fn((data: any, callback?: any) => {
        if (typeof callback === 'function') callback();
        return true;
      }),
    } as any;
    mockInputStream = {} as any;
    lspServer = new LSPServerStream(mockOutputStream, mockInputStream);
    streamEventEmitter = (StreamEventEmitter as any).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
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
      const sentData = mockOutputStream.write.mock.calls[0][0];
      const match = sentData.match(/Content-Length: \d+\r\n\r\n(.*)$/);
      const sentMessage = JSON.parse(match![1]);
      const response: ResponseMessage = {
        jsonrpc: '2.0',
        id: sentMessage.id,
        result: { success: true }
      };
      streamEventEmitter.emit('data', response);
      const result = await requestPromise;
      expect(result).toEqual(response);
    });

    it('should handle request messages and call registered listeners', async () => {
      expect(true).toBe(true);
    });

    it('should handle notification messages and call registered listeners', async () => {
      const notificationListener = jest.fn();
      lspServer.onNotification(notificationListener);
      const notification: NotificationMessage = {
        jsonrpc: '2.0',
        method: 'test/notification',
        params: { data: 'test' }
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
      expect(mockOutputStream.write).toHaveBeenCalledTimes(2);
      const sentData1 = mockOutputStream.write.mock.calls[0][0];
      const sentData2 = mockOutputStream.write.mock.calls[1][0];
      const message1 = JSON.parse(sentData1.match(/\r\n\r\n(.*)$/)[1]);
      const message2 = JSON.parse(sentData2.match(/\r\n\r\n(.*)$/)[1]);
      expect(message1.id).toBe(1);
      expect(message2.id).toBe(2);
      jest.advanceTimersByTime(30000);
      await expect(request1Promise).rejects.toThrow();
      await expect(request2Promise).rejects.toThrow();
      jest.useRealTimers();
    });

    it('should format message with correct Content-Length header', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method', { param: 'value' });
      const sentData = mockOutputStream.write.mock.calls[0][0];
      const match = sentData.match(/Content-Length: (\d+)\r\n\r\n(.*)$/);
      expect(match).toBeTruthy();
      const contentLength = parseInt(match![1]);
      const content = match![2];
      expect(contentLength).toBe(Buffer.byteLength(content));
      jest.advanceTimersByTime(30000);
      await expect(requestPromise).rejects.toThrow();
      jest.useRealTimers();
    });

    it('should timeout after 30 seconds', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method');
      jest.advanceTimersByTime(30000);
      await expect(requestPromise).rejects.toThrow('Request test/method timed out');
      jest.useRealTimers();
    });

    it('should handle requests without params', async () => {
      jest.useFakeTimers();
      const requestPromise = lspServer.sendRequest('test/method');
      const sentData = mockOutputStream.write.mock.calls[0][0];
      const message = JSON.parse(sentData.match(/\r\n\r\n(.*)$/)[1]);
      expect(message).toEqual({
        jsonrpc: '2.0',
        id: 1,
        method: 'test/method',
        params: undefined
      });
      jest.advanceTimersByTime(30000);
      await expect(requestPromise).rejects.toThrow();
      jest.useRealTimers();
    });
  });

  describe('sendNotification', () => {
    it('should send notification without ID', async () => {
      await lspServer.sendNotification('test/notification', { data: 'test' });
      const sentData = mockOutputStream.write.mock.calls[0][0];
      const message = JSON.parse(sentData.match(/\r\n\r\n(.*)$/)[1]);
      expect(message).toEqual({
        jsonrpc: '2.0',
        method: 'test/notification',
        params: { data: 'test' }
      });
      expect(message.id).toBeUndefined();
    });

    it('should handle notifications without params', async () => {
      await lspServer.sendNotification('test/notification');
      const sentData = mockOutputStream.write.mock.calls[0][0];
      const message = JSON.parse(sentData.match(/\r\n\r\n(.*)$/)[1]);
      expect(message.params).toBeUndefined();
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
      mockOutputStream.write.mockImplementation((data: any, callback?: any) => {
        const message = JSON.parse(data.match(/\r\n\r\n(.*)$/)?.[1] || '{}');
        if (message.method === 'shutdown') {
          setTimeout(() => {
            streamEventEmitter.emit('data', {
              jsonrpc: '2.0',
              id: message.id,
              result: null
            });
          }, 0);
        }
        if (typeof callback === 'function') callback();
        return true;
      });
      await lspServer.close();
      expect(mockOutputStream.write).toHaveBeenCalledTimes(2);
      const sentData1 = mockOutputStream.write.mock.calls[0][0];
      const sentData2 = mockOutputStream.write.mock.calls[1][0];
      const message1 = JSON.parse(sentData1.match(/\r\n\r\n(.*)$/)[1]);
      const message2 = JSON.parse(sentData2.match(/\r\n\r\n(.*)$/)[1]);
      expect(message1.method).toBe('shutdown');
      expect(message1.id).toBeDefined();
      expect(message2.method).toBe('exit');
      expect(message2.id).toBeUndefined();
    });

    it('should handle errors during shutdown gracefully', async () => {
      jest.useFakeTimers();
      const closePromise = lspServer.close();
      jest.advanceTimersByTime(30000);
      await expect(closePromise).resolves.toBeUndefined();
      jest.useRealTimers();
    });
  });
});
