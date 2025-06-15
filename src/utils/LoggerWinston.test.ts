import { Writable } from 'stream';

import winston from 'winston';

import { LoggerWinston } from './LoggerWinston';

describe('LoggerWinston', () => {
  let logBuffer: string[];
  let winstonLogger: winston.Logger;
  let logger: LoggerWinston;

  beforeEach(() => {
    logBuffer = [];
    const memoryStream = new Writable({
      write(chunk: Buffer, encoding: string, callback: () => void): boolean {
        logBuffer.push(chunk.toString().trim());
        callback();
        return true;
      },
    });

    winstonLogger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { timestamp, level, message, ...meta } = info;
          let metaStr = '';
          if (Object.keys(meta).length > 0) {
            try {
              metaStr = ` ${JSON.stringify(meta)}`;
            } catch {
              metaStr = ` ${JSON.stringify({ error: 'Circular reference detected' })}`;
            }
          }
          return `${String(timestamp)} [${String(level)}]: ${String(message)}${metaStr}`;
        }),
      ),
      transports: [
        new winston.transports.Stream({
          stream: memoryStream,
        }),
      ],
    });

    logger = new LoggerWinston(winstonLogger);
  });

  describe('basic logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message');

      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0]).toContain('[debug]: Debug message');
    });

    it('should log info messages', () => {
      logger.info('Info message');

      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0]).toContain('[info]: Info message');
    });

    it('should log warn messages', () => {
      logger.warn('Warn message');

      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0]).toContain('[warn]: Warn message');
    });

    it('should log error messages', () => {
      logger.error('Error message');

      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0]).toContain('[error]: Error message');
    });
  });

  describe('metadata handling', () => {
    it('should handle single metadata object', () => {
      logger.info('Test message', { userId: 123, action: 'login' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"userId":123');
      expect(logEntry).toContain('"action":"login"');
    });

    it('should handle multiple metadata objects', () => {
      logger.info('Test message', { userId: 123 }, { action: 'login' }, { ip: '127.0.0.1' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"userId":123');
      expect(logEntry).toContain('"action":"login"');
      expect(logEntry).toContain('"ip":"127.0.0.1"');
    });

    it('should handle primitive metadata values', () => {
      logger.info('Test message', 'string meta', 42, true);

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"string meta"');
      expect(logEntry).toContain('42');
      expect(logEntry).toContain('true');
    });

    it('should handle null and undefined metadata', () => {
      logger.info('Test message', null, undefined, { valid: 'data' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('null');
      expect(logEntry).toContain('"valid":"data"');
    });

    it('should handle empty metadata gracefully', () => {
      logger.info('Test message');

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[info\]: Test message$/);
    });
  });

  describe('winston reserved fields handling', () => {
    it('should sanitize metadata with winston reserved "message" field', () => {
      logger.info('Test message', { message: 'conflicting message', userId: 123 });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"data":{"message":"conflicting message"}');
      expect(logEntry).toContain('"userId":123');
    });

    it('should sanitize metadata with winston reserved "level" field', () => {
      logger.info('Test message', { level: 'error', otherData: 'some data' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"data":{"level":"error"}');
      expect(logEntry).toContain('"otherData":"some data"');
    });

    it('should sanitize metadata with winston reserved "timestamp" field', () => {
      logger.info('Test message', { timestamp: '2023-01-01', other: 'value' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"data":{"timestamp":"2023-01-01"}');
      expect(logEntry).toContain('"other":"value"');
    });

    it('should sanitize metadata with winston reserved "stack" field', () => {
      logger.info('Test message', { stack: 'fake stack trace', info: 'data' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"data":{"stack":"fake stack trace"}');
      expect(logEntry).toContain('"info":"data"');
    });

    it('should handle metadata with only reserved fields', () => {
      logger.info('Test message', { message: 'conflicting', level: 'error' });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"data":{"message":"conflicting","level":"error"}');
    });

    it('should handle metadata without reserved fields normally', () => {
      logger.info('Test message', { userId: 123, action: 'test', nested: { value: 'data' } });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"userId":123');
      expect(logEntry).toContain('"action":"test"');
      expect(logEntry).toContain('"nested":{"value":"data"}');
      expect(logEntry).not.toContain('"data":');
    });
  });

  describe('complex metadata scenarios', () => {
    it('should handle mixed reserved and non-reserved fields across multiple metadata objects', () => {
      logger.info('Test message',
        { userId: 123, message: 'user message' },
        { level: 'custom', action: 'login' },
      );

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"userId":123');
      expect(logEntry).toContain('"action":"login"');
      expect(logEntry).toContain('"data":{"message":"user message","level":"custom"}');
    });

    it('should handle Error objects in metadata', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[error]: Error occurred');
      expect(logEntry).toContain('"stack":');
      expect(logEntry).toContain('"name":"Error"');
    });

    it('should handle deeply nested objects with reserved fields', () => {
      logger.info('Test message', {
        user: { id: 123, message: 'nested message' },
        request: { level: 'high', timestamp: '2023-01-01' },
        normal: 'field',
      });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Test message');
      expect(logEntry).toContain('"normal":"field"');
      // Since we only sanitize top-level reserved fields, nested ones are preserved
      expect(logEntry).toContain('"user":{"id":123,"message":"nested message"}');
      expect(logEntry).toContain('"request":{"level":"high","timestamp":"2023-01-01"}');
    });
  });

  describe('edge cases', () => {
    it('should handle circular references in metadata', () => {
      const circular = { name: 'test' } as { name: string; self?: unknown };
      circular.self = circular;

      expect(() => {
        logger.info('Circular test', circular);
      }).not.toThrow();

      expect(logBuffer).toHaveLength(1);
      expect(logBuffer[0]).toContain('[info]: Circular test');
      expect(logBuffer[0]).toContain('"error":"Circular reference detected"');
    });

    it('should handle arrays in metadata', () => {
      logger.info('Array test', { items: [1, 2, 3], tags: ['a', 'b'] });

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Array test');
      expect(logEntry).toContain('"items":[1,2,3]');
      expect(logEntry).toContain('"tags":["a","b"]');
    });

    it('should handle very large metadata objects', () => {
      const largeObject: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`key${i}`] = i;
      }

      logger.info('Large object test', largeObject);

      expect(logBuffer).toHaveLength(1);
      const logEntry = logBuffer[0];
      expect(logEntry).toContain('[info]: Large object test');
      expect(logEntry).toContain('"key0":0');
      expect(logEntry).toContain('"key99":99');
    });
  });
});
