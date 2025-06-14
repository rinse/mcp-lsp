import path from 'path';

import winston from 'winston';

const logDir = process.env.LOG_DIR ?? path.join(process.cwd(), 'logs');
const logLevel = process.env.LOG_LEVEL ?? 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.combine(
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${String(timestamp)} [${String(level)}]: ${String(message)}${typeof stack === 'string' ? `\n${  stack}` : ''}`;
      }),
    ),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});
