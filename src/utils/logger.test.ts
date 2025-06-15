import { Writable } from 'stream';

import winston from 'winston';

import { createLoggerOptions } from './logger';

describe('Logger', () => {
  let logBuffer: string[];
  let testLogger: winston.Logger;

  beforeEach(() => {
    logBuffer = [];
    const options = createLoggerOptions('/tmp', 'debug');
    const memoryStream = new Writable({
      write(chunk: Buffer, encoding: string, callback: () => void): boolean {
        logBuffer.push(chunk.toString().trim());
        callback();
        return true;
      },
    });
    options.transports = [
      new winston.transports.Stream({
        stream: memoryStream,
      }),
    ];
    testLogger = winston.createLogger(options);
  });

  describe('createLoggerOptions', () => {
    it('should create logger options with correct log level', () => {
      const options = createLoggerOptions('/tmp/test-logs', 'warn');
      expect(options.level).toBe('warn');
    });

    it('should create logger options with file transports', () => {
      const options = createLoggerOptions('/tmp/test-logs', 'info');
      expect(options.transports).toHaveLength(3);
      expect(options.transports).toBeDefined();
    });
  });

  describe('log formats', () => {
    it('should format basic log message correctly', () => {
      testLogger.info('Test message');

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\]: Test message$/);
    });

    it('should format log message with metadata', () => {
      testLogger.info('Test message', { userId: 123, action: 'login' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\]: Test message {"userId":123,"action":"login"}$/);
    });

    it('should format error message with stack trace', () => {
      const error = new Error('Test error');
      testLogger.error('Error occurred', error);

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[error\]: Error occurred/);
      expect(logEntry).toContain('\nError: Test error');
      expect(logEntry).toContain('at ');
    });

    it('should format different log levels correctly', () => {
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warn message');
      testLogger.error('Error message');

      expect(logBuffer).toHaveLength(4);
      expect(logBuffer[0]).toContain('[debug]: Debug message');
      expect(logBuffer[1]).toContain('[info]: Info message');
      expect(logBuffer[2]).toContain('[warn]: Warn message');
      expect(logBuffer[3]).toContain('[error]: Error message');
    });

    it('should handle empty metadata object', () => {
      testLogger.info('Test message', {});

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\]: Test message$/);
      expect(logEntry).not.toContain('{}');
    });

    it('should handle complex metadata', () => {
      const metadata = {
        user: { id: 123, name: 'John' },
        request: { method: 'GET', url: '/api/test' },
        nested: { deep: { value: 'test' } },
      };
      testLogger.info('Complex metadata', metadata);

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Complex metadata');
      expect(logEntry).toContain('"user":{"id":123,"name":"John"}');
      expect(logEntry).toContain('"request":{"method":"GET","url":"/api/test"}');
      expect(logEntry).toContain('"nested":{"deep":{"value":"test"}}');
    });

    it('should preserve timestamp format', () => {
      testLogger.info('Timestamp test');

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      const timestampMatch = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/.exec(logEntry);
      expect(timestampMatch).toBeTruthy();

      const timestamp = new Date(timestampMatch![1]);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should not show [object Object] when logging objects properly', () => {
      const testObject = { id: 123, name: 'test', nested: { value: 'data' } };
      testLogger.info('Test message with object', { data: testObject });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).not.toContain('[object Object]');
      expect(logEntry).toContain('"data":{"id":123,"name":"test","nested":{"value":"data"}}');
    });

    it('should handle logger.warn with structured object correctly', () => {
      const resultObject = { type: 'invalid', code: 500, details: { reason: 'bad data' } };
      testLogger.warn('Invalid result type', { result: resultObject });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).not.toContain('[object Object]');
      expect(logEntry).toContain('[warn]: Invalid result type');
      expect(logEntry).toContain('"result":{"type":"invalid","code":500,"details":{"reason":"bad data"}}');
    });
  });
});
