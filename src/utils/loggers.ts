import path from 'path';

import winston, { createLogger, LoggerOptions } from 'winston';

import { Logger } from './Logger';
import { LoggerWinston } from './LoggerWinston';

const logDir = process.env.LOG_DIR ?? path.join(process.cwd(), '.logs');
const logLevel = process.env.LOG_LEVEL ?? 'info';

export function createLoggerOptions(logDir: string, logLevel: string): LoggerOptions {
  return {
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.combine(
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaString = Object.keys(meta).length > 0
            ? JSON.stringify(meta)
            : '';
          return `${String(timestamp)} [${String(level)}]: ${String(message)} ${metaString}${typeof stack === 'string' ? '\n' + stack : ''}`;
        }),
      ),
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'debug.log'),
        level: 'debug',
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
      }),
    ],
  };
}

const winstonLogger = createLogger(createLoggerOptions(logDir, logLevel));

export const logger: Logger = new LoggerWinston(winstonLogger);
